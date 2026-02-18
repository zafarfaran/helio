"""Client endpoints — list clients with tax summaries and detail views."""

import re
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from structlog.stdlib import BoundLogger

from app.db.engine import get_db_session
from app.db.models import Client, Household, Observation, TaxProfile
from app.dependencies import get_request_logger
from app.tax.engine import compute_full_tax_position
from app.tax.types import IncomeSource as TaxIncomeSource, IncomeType

router = APIRouter(tags=["clients"])


class CreateClientRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    date_of_birth: str
    ni_number: str
    utr: str
    region: Literal["england", "wales", "scotland", "northern_ireland"] = "england"
    employment_status: Literal["employed", "self-employed", "director", "retired", "other"] = "employed"
    notes: str | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", v):
            raise ValueError("Enter a valid email address")
        return v.lower()

    @field_validator("ni_number")
    @classmethod
    def validate_ni_number(cls, v: str) -> str:
        if not re.match(r"^[A-Za-z]{2}\d{6}[A-Za-z]$", v):
            raise ValueError("NI number must match format AB123456C")
        return v.upper()

    @field_validator("utr")
    @classmethod
    def validate_utr(cls, v: str) -> str:
        if not re.match(r"^\d{10}$", v):
            raise ValueError("UTR must be exactly 10 digits")
        return v


class IncomeSourceInput(BaseModel):
    type: Literal["employment", "self_employment", "rental", "pension_income", "savings", "dividends", "other"]
    gross_amount: float
    label: str = ""


class ComputeTaxProfileRequest(BaseModel):
    income_sources: list[IncomeSourceInput]
    pension_contributions: float = 0
    gift_aid: float = 0
    claims_child_benefit: bool = False
    number_of_children: int = 0
    isa_contributions: float = 0
    cgt_gains: float = 0

    @field_validator("income_sources")
    @classmethod
    def validate_income_sources(cls, v: list) -> list:
        if len(v) == 0:
            raise ValueError("At least one income source is required")
        return v


@router.get("/clients")
async def list_clients(
    session: AsyncSession = Depends(get_db_session),
    logger: BoundLogger = Depends(get_request_logger),
):
    """List all clients with their latest tax profile summary."""
    user_id = "demo-user"

    logger.info("Listing clients", user_id=user_id)

    result = await session.execute(
        select(Client).where(Client.user_id == user_id)
    )
    clients = list(result.scalars().all())

    clients_out = []
    for client in clients:
        # Fetch latest TaxProfile for each client (by created_at DESC, limit 1)
        tp_result = await session.execute(
            select(TaxProfile)
            .where(TaxProfile.client_id == client.id)
            .order_by(desc(TaxProfile.created_at))
            .limit(1)
        )
        tax_profile = tp_result.scalar_one_or_none()

        clients_out.append({
            "id": client.id,
            "first_name": client.first_name,
            "last_name": client.last_name,
            "email": client.email,
            "region": client.region,
            "employment_status": client.employment_status,
            "tax_year": tax_profile.tax_year if tax_profile else None,
            "total_income": tax_profile.total_income if tax_profile else None,
            "total_tax": tax_profile.total_tax if tax_profile else None,
            "effective_rate": tax_profile.effective_rate if tax_profile else None,
            "marginal_rate": tax_profile.marginal_rate if tax_profile else None,
        })

    logger.info("Clients listed", count=len(clients_out))

    return {"clients": clients_out}


@router.get("/clients/{client_id}")
async def get_client(
    client_id: str,
    session: AsyncSession = Depends(get_db_session),
    logger: BoundLogger = Depends(get_request_logger),
):
    """Get client detail with full tax profile and observations."""
    logger.info("Fetching client detail", client_id=client_id)

    # Load client
    result = await session.execute(
        select(Client).where(Client.id == client_id)
    )
    client = result.scalar_one_or_none()

    if client is None:
        logger.warning("Client not found", client_id=client_id)
        raise HTTPException(status_code=404, detail="Client not found")

    # Load latest tax profile
    tp_result = await session.execute(
        select(TaxProfile)
        .where(TaxProfile.client_id == client_id)
        .order_by(desc(TaxProfile.created_at))
        .limit(1)
    )
    tax_profile = tp_result.scalar_one_or_none()

    # Load observations
    obs_result = await session.execute(
        select(Observation)
        .where(Observation.client_id == client_id)
        .order_by(desc(Observation.created_at))
    )
    observations = list(obs_result.scalars().all())

    # Build tax profile dict with all JSON fields
    tax_profile_out = None
    if tax_profile:
        tax_profile_out = {
            "tax_year": tax_profile.tax_year,
            "total_income": tax_profile.total_income,
            "adjusted_net_income": tax_profile.adjusted_net_income,
            "taxable_income": tax_profile.taxable_income,
            "income_tax": tax_profile.income_tax,
            "national_insurance": tax_profile.national_insurance,
            "dividend_tax": tax_profile.dividend_tax,
            "total_tax": tax_profile.total_tax,
            "effective_rate": tax_profile.effective_rate,
            "marginal_rate": tax_profile.marginal_rate,
            "personal_allowance": tax_profile.personal_allowance,
            "pa_status": tax_profile.pa_status,
            "in_pa_taper_zone": tax_profile.in_pa_taper_zone,
            "hicbc_applies": tax_profile.hicbc_applies,
            "pension_taper_applies": tax_profile.pension_taper_applies,
            "income_sources": tax_profile.income_sources,
            "pension_data": tax_profile.pension_data,
            "allowances": tax_profile.allowances,
            "hicbc": tax_profile.hicbc,
            "tax_breakdown": tax_profile.tax_breakdown,
            "ni_breakdown": tax_profile.ni_breakdown,
        }

    # Build observations list
    observations_out = [
        {
            "id": obs.id,
            "tax_year": obs.tax_year,
            "title": obs.title,
            "description": obs.description,
            "severity": obs.severity,
            "priority": obs.priority,
            "category": obs.category,
            "potential_saving": obs.potential_saving,
            "deadline": obs.deadline,
            "action_required": obs.action_required,
            "is_dismissed": obs.is_dismissed,
            "created_at": obs.created_at.isoformat() if obs.created_at else None,
        }
        for obs in observations
    ]

    logger.info(
        "Client detail loaded",
        client_id=client_id,
        has_tax_profile=tax_profile is not None,
        observation_count=len(observations_out),
    )

    return {
        "id": client.id,
        "first_name": client.first_name,
        "last_name": client.last_name,
        "email": client.email,
        "date_of_birth": client.date_of_birth,
        "ni_number": client.ni_number,
        "utr": client.utr,
        "region": client.region,
        "employment_status": client.employment_status,
        "created_at": client.created_at.isoformat() if client.created_at else None,
        "tax_profile": tax_profile_out,
        "observations": observations_out,
    }


@router.post("/clients", status_code=201)
async def create_client(
    body: CreateClientRequest,
    session: AsyncSession = Depends(get_db_session),
    logger: BoundLogger = Depends(get_request_logger),
):
    """Create a new client with an auto-generated household."""
    user_id = "demo-user"

    logger.info("Creating client", first_name=body.first_name, last_name=body.last_name)

    # Create a household for this client
    household = Household(
        user_id=user_id,
        name=f"{body.last_name} Household",
    )
    session.add(household)
    await session.flush()  # Get the household ID

    # Create the client
    client = Client(
        household_id=household.id,
        user_id=user_id,
        first_name=body.first_name,
        last_name=body.last_name,
        email=body.email,
        date_of_birth=body.date_of_birth,
        ni_number=body.ni_number,
        utr=body.utr,
        region=body.region,
        employment_status=body.employment_status,
        metadata_={"notes": body.notes} if body.notes else {},
    )
    session.add(client)
    await session.flush()

    logger.info("Client created", client_id=client.id)

    return {
        "id": client.id,
        "first_name": client.first_name,
        "last_name": client.last_name,
        "email": client.email,
        "date_of_birth": client.date_of_birth,
        "ni_number": client.ni_number,
        "utr": client.utr,
        "region": client.region,
        "employment_status": client.employment_status,
    }


@router.post("/clients/{client_id}/tax-profile")
async def compute_client_tax_profile(
    client_id: str,
    body: ComputeTaxProfileRequest,
    session: AsyncSession = Depends(get_db_session),
    logger: BoundLogger = Depends(get_request_logger),
):
    """Compute and save a tax profile for a client using the deterministic engine."""

    # Load client
    result = await session.execute(
        select(Client).where(Client.id == client_id)
    )
    client = result.scalar_one_or_none()
    if client is None:
        raise HTTPException(status_code=404, detail="Client not found")

    logger.info("Computing tax profile", client_id=client_id)

    # Build engine inputs
    engine_sources = [
        TaxIncomeSource(
            source_type=IncomeType(s.type),
            gross_amount=s.gross_amount,
            label=s.label or s.type.replace("_", " ").title(),
        )
        for s in body.income_sources
    ]

    # Run engine
    pos = compute_full_tax_position(
        engine_sources,
        pension_contributions=body.pension_contributions,
        gift_aid=body.gift_aid,
        region=client.region or "england",
        number_of_children=body.number_of_children,
        claims_child_benefit=body.claims_child_benefit,
    )

    # Delete existing tax profile and observations for this client + tax year
    existing_tp = await session.execute(
        select(TaxProfile).where(
            TaxProfile.client_id == client_id,
            TaxProfile.tax_year == pos.tax_year,
        )
    )
    old_tp = existing_tp.scalar_one_or_none()
    if old_tp:
        await session.delete(old_tp)

    existing_obs = await session.execute(
        select(Observation).where(Observation.client_id == client_id)
    )
    for obs in existing_obs.scalars().all():
        await session.delete(obs)

    await session.flush()

    # Save new TaxProfile
    tax_profile = TaxProfile(
        client_id=client_id,
        tax_year=pos.tax_year,
        total_income=pos.total_income,
        adjusted_net_income=pos.adjusted_net_income,
        taxable_income=pos.taxable_income,
        income_tax=pos.income_tax,
        national_insurance=pos.national_insurance,
        dividend_tax=pos.dividend_tax,
        total_tax=pos.total_tax,
        effective_rate=pos.effective_rate,
        marginal_rate=pos.marginal_rate,
        personal_allowance=pos.personal_allowance,
        pa_status=pos.pa_status,
        in_pa_taper_zone=pos.in_pa_taper_zone,
        hicbc_applies=pos.hicbc_applies,
        pension_taper_applies=pos.pension_taper_applies,
        income_sources=[
            {
                "source_type": s.source_type.value,
                "label": s.label or s.source_type.value.replace("_", " ").title(),
                "gross_amount": s.gross_amount,
            }
            for s in pos.income_sources
        ],
        pension_data={
            "contributions": body.pension_contributions,
            "aa_remaining": pos.pension_aa_result.remaining if pos.pension_aa_result else 60_000 - body.pension_contributions,
            "annual_allowance": pos.pension_aa_result.annual_allowance if pos.pension_aa_result else 60_000,
        },
        allowances=[
            {
                "type": "personal_allowance",
                "label": "Personal Allowance",
                "annual_limit": 12_570,
                "used": 12_570 - pos.personal_allowance,
                "remaining": pos.personal_allowance,
                "status": "fully_used" if pos.personal_allowance == 0 else "available",
            },
            {
                "type": "pension_aa",
                "label": "Pension Annual Allowance",
                "annual_limit": 60_000,
                "used": body.pension_contributions,
                "remaining": pos.pension_aa_result.remaining if pos.pension_aa_result else 60_000 - body.pension_contributions,
            },
            {
                "type": "dividend",
                "label": "Dividend Allowance",
                "annual_limit": 500,
                "used": pos.income_tax_result.dividend_allowance_used,
                "remaining": 500 - pos.income_tax_result.dividend_allowance_used,
            },
            {
                "type": "isa",
                "label": "ISA Allowance",
                "annual_limit": 20_000,
                "used": body.isa_contributions,
                "remaining": 20_000 - body.isa_contributions,
            },
            {
                "type": "cgt_aea",
                "label": "CGT Annual Exemption",
                "annual_limit": 3_000,
                "used": body.cgt_gains,
                "remaining": max(0, 3_000 - body.cgt_gains),
            },
        ],
        hicbc={
            "number_of_children": body.number_of_children,
            "claims_child_benefit": body.claims_child_benefit,
            "child_benefit_amount": pos.hicbc_result.child_benefit_annual if pos.hicbc_result else 0,
            "clawback_percentage": pos.hicbc_result.clawback_percentage if pos.hicbc_result else 0,
            "hicbc_charge": pos.hicbc_result.hicbc_charge if pos.hicbc_result else 0,
        },
        tax_breakdown=[
            {
                "band": b.name,
                "amount": b.income_in_band,
                "rate": b.rate,
                "tax": b.tax,
            }
            for b in pos.income_tax_result.non_savings_bands
        ],
        ni_breakdown={
            "class1": {
                "total_employee_ni": pos.ni_result.class_1.total_employee_ni if pos.ni_result.class_1 else 0,
            },
            "class2": {
                "annual_ni": pos.ni_result.class_2.annual_ni if pos.ni_result.class_2 else 0,
            },
            "class4": {
                "total_ni": pos.ni_result.class_4.total_ni if pos.ni_result.class_4 else 0,
            },
        },
        status="computed",
        data_confidence="high",
    )
    session.add(tax_profile)

    # Save observations
    for obs_item in pos.observations:
        session.add(Observation(
            client_id=client_id,
            tax_year=pos.tax_year,
            title=obs_item.title,
            description=obs_item.description,
            severity=obs_item.severity,
            priority="high" if obs_item.severity in ("warning", "critical") else "medium",
            category=obs_item.category,
            potential_saving=obs_item.potential_saving,
        ))

    await session.flush()

    logger.info("Tax profile computed and saved", client_id=client_id, total_tax=pos.total_tax)

    # Return full client detail (reuse existing endpoint logic)
    return await get_client(client_id, session, logger)

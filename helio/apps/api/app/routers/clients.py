"""Client endpoints — list clients with tax summaries and detail views."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from structlog.stdlib import BoundLogger

from app.db.engine import get_db_session
from app.db.models import Client, Household, Observation, TaxProfile
from app.dependencies import get_request_logger

router = APIRouter(tags=["clients"])


class CreateClientRequest(BaseModel):
    first_name: str
    last_name: str
    email: str
    date_of_birth: str
    ni_number: str
    utr: str
    region: str = "england"
    employment_status: str = "employed"
    notes: str | None = None


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

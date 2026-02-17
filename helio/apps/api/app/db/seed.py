"""Seed the database with demo data if it is empty."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import get_logger
from app.db.models import (
    Client,
    Conversation,
    Household,
    MeetingNote,
    Message,
    Observation,
    TaxProfile,
    User,
)

logger = get_logger(__name__)


async def seed_if_empty(session: AsyncSession) -> None:
    """Insert demo data when the users table is empty."""
    result = await session.execute(select(User).limit(1))
    if result.scalars().first() is not None:
        logger.info("Database already seeded — skipping")
        return

    logger.info("Seeding database with demo data")

    # ── User ────────────────────────────────────────────────────────────
    user = User(
        id="demo-user",
        email="adviser@helio.ai",
        full_name="Demo Adviser",
        role="adviser",
    )
    session.add(user)

    # ── Household ───────────────────────────────────────────────────────
    household = Household(
        id="hh-mitchell",
        user_id="demo-user",
        name="Mitchell Household",
    )
    session.add(household)

    # ── Client ──────────────────────────────────────────────────────────
    client = Client(
        id="client-sarah",
        household_id="hh-mitchell",
        user_id="demo-user",
        first_name="Sarah",
        last_name="Mitchell",
        region="england",
        employment_status="employed",
        date_of_birth="1982-03-15",
        ni_number="QQ 12 34 56 C",
    )
    session.add(client)

    # ── TaxProfile (2025/26) ────────────────────────────────────────────
    tax_profile = TaxProfile(
        id="tp-sarah-2526",
        client_id="client-sarah",
        tax_year="2025/26",
        total_income=195500.0,
        adjusted_net_income=183930.0,
        taxable_income=183930.0,
        income_tax=42432.0,
        national_insurance=5486.0,
        dividend_tax=4069.0,
        total_tax=52847.0,
        effective_rate=27.0,
        marginal_rate=40.0,
        personal_allowance=0.0,
        pa_status="lost",
        in_pa_taper_zone=True,
        hicbc_applies=True,
        pension_taper_applies=False,
        income_sources=[
            {
                "source_type": "employment",
                "label": "Employment",
                "gross_amount": 145000,
            },
            {
                "source_type": "dividends",
                "label": "Dividends",
                "gross_amount": 32500,
            },
            {
                "source_type": "rental",
                "label": "Rental",
                "gross_amount": 18000,
            },
        ],
        pension_data={
            "contributions": 18000,
            "aa_remaining": 42000,
            "annual_allowance": 60000,
        },
        allowances=[
            {
                "type": "personal_allowance",
                "label": "Personal Allowance",
                "annual_limit": 12570,
                "used": 12570,
                "remaining": 0,
                "status": "fully_used",
            },
            {
                "type": "pension_aa",
                "label": "Pension Annual Allowance",
                "annual_limit": 60000,
                "used": 18000,
                "remaining": 42000,
            },
            {
                "type": "isa",
                "label": "ISA Allowance",
                "annual_limit": 20000,
                "used": 0,
                "remaining": 20000,
            },
            {
                "type": "dividend",
                "label": "Dividend Allowance",
                "annual_limit": 500,
                "used": 500,
                "remaining": 0,
            },
            {
                "type": "cgt_aea",
                "label": "CGT Annual Exemption",
                "annual_limit": 3000,
                "used": 0,
                "remaining": 3000,
            },
        ],
        hicbc={
            "number_of_children": 2,
            "claims_child_benefit": True,
            "child_benefit_amount": 2212.60,
            "clawback_percentage": 100,
            "hicbc_charge": 860,
        },
        tax_breakdown=[
            {"band": "Basic Rate", "amount": 37700, "rate": 0.20, "tax": 7540},
            {"band": "Higher Rate", "amount": 87430, "rate": 0.40, "tax": 34972},
        ],
        ni_breakdown={
            "class1": {
                "total_employee_ni": 5486,
            },
        },
        status="draft",
        data_confidence="low",
    )
    session.add(tax_profile)

    # ── Observations ────────────────────────────────────────────────────
    observations = [
        Observation(
            id="obs-1",
            client_id="client-sarah",
            tax_year="2025/26",
            title="Personal allowance tapered to \u00a30",
            description="Income exceeds \u00a3125,140 \u2014 full PA taper applies",
            severity="critical",
            priority="high",
            category="personal_allowance",
        ),
        Observation(
            id="obs-2",
            client_id="client-sarah",
            tax_year="2025/26",
            title="\u00a342,000 pension headroom",
            description="Potential saving of \u00a316,800 at marginal rate",
            severity="opportunity",
            priority="high",
            category="pension",
            potential_saving=16800.0,
        ),
        Observation(
            id="obs-3",
            client_id="client-sarah",
            tax_year="2025/26",
            title="Unused ISA allowance",
            description="Shelter dividend income to reduce tax exposure",
            severity="opportunity",
            priority="medium",
            category="isa",
        ),
        Observation(
            id="obs-4",
            client_id="client-sarah",
            tax_year="2025/26",
            title="HICBC applicable",
            description="Salary sacrifice could eliminate the charge",
            severity="warning",
            priority="medium",
            category="hicbc",
        ),
    ]
    session.add_all(observations)

    # ── Meeting Notes ──────────────────────────────────────────────────
    meeting_notes = [
        MeetingNote(
            id="mn-1",
            client_id="client-sarah",
            author_id="demo-user",
            meeting_date=datetime(2025, 11, 14, 10, 0, tzinfo=timezone.utc),
            subject="Annual review — 2025/26 tax planning",
            attendees="Sarah Mitchell, James Mitchell (spouse)",
            summary=(
                "Reviewed Sarah's current tax position for 2025/26. Total income at £195,500 "
                "across employment (£145k), dividends (£32.5k) and rental (£18k). "
                "Personal allowance fully tapered — paying an effective 60% marginal rate in the "
                "taper zone. Discussed pension contribution strategy: Sarah's employer offers "
                "salary sacrifice but she hasn't increased contributions beyond the default 6%. "
                "James earns approximately £45,000 from his consultancy and has unused pension "
                "allowance. They have two children (ages 8 and 11) and are currently claiming "
                "Child Benefit — triggering HICBC. Sarah expressed interest in reducing overall "
                "household tax burden before April 2026. She mentioned a potential £80k bonus "
                "expected in February 2026 which would push income significantly higher."
            ),
            action_items=[
                "Model salary sacrifice scenario — increase pension contributions to restore PA",
                "Calculate HICBC impact and salary sacrifice threshold to eliminate it",
                "Explore spousal transfer of rental property to utilise James's basic rate band",
                "Prepare Bed & ISA analysis for dividend-generating portfolio",
                "Revisit once bonus amount confirmed — may need carry-forward pension planning",
            ],
            tags=["annual-review", "pension", "hicbc", "salary-sacrifice"],
        ),
        MeetingNote(
            id="mn-2",
            client_id="client-sarah",
            author_id="demo-user",
            meeting_date=datetime(2025, 7, 3, 14, 30, tzinfo=timezone.utc),
            subject="Rental property — remortgage and tax implications",
            attendees="Sarah Mitchell",
            summary=(
                "Sarah is remortgaging one of her two buy-to-let properties. Current rental "
                "income is £18,000 across both properties (£10,800 from Flat A in Clapham, "
                "£7,200 from Flat B in Brixton). Mortgage interest on Flat A is £4,200/yr — "
                "she only gets basic rate relief (20%) as a higher-rate taxpayer. Discussed "
                "incorporating the properties into a limited company but decided against it "
                "due to CGT crystallisation and SDLT costs. Sarah also mentioned she may sell "
                "Flat B within the next 18 months — we need to plan around CGT annual exemption "
                "and potential principal private residence relief considerations. She has never "
                "lived in Flat B so PPR would not apply."
            ),
            action_items=[
                "Calculate CGT exposure on potential sale of Flat B (estimated current value £320k, purchase price £245k)",
                "Check if CGT annual exemption can be used against other gains",
                "Review mortgage interest relief position under Section 24 restrictions",
            ],
            tags=["rental", "property", "cgt", "mortgage"],
        ),
        MeetingNote(
            id="mn-3",
            client_id="client-sarah",
            author_id="demo-user",
            meeting_date=datetime(2025, 3, 20, 9, 0, tzinfo=timezone.utc),
            subject="Pre year-end planning — 2024/25 wrap-up",
            attendees="Sarah Mitchell, James Mitchell",
            summary=(
                "Urgent pre-5 April meeting. Sarah had not yet used her ISA allowance for "
                "2024/25. Recommended immediate Bed & ISA transfer of £20k from her GIA — "
                "she holds approximately £85k in a global equity fund with £12k unrealised gains. "
                "Also confirmed that James used his full ISA allowance in February. "
                "Sarah made a £5,000 Gift Aid donation to Cancer Research UK in March — "
                "this extends her basic rate band and provides additional higher rate relief. "
                "Pension carry-forward: confirmed Sarah has £14,000 unused from 2021/22 (3 years "
                "available) on top of current year's £42,000 remaining. Total available headroom "
                "could be up to £56,000 if carry-forward claimed."
            ),
            action_items=[
                "Confirm Bed & ISA completed before 5 April",
                "File Gift Aid claim on Self Assessment return",
                "Document pension carry-forward position for 2025/26 planning",
            ],
            tags=["year-end", "isa", "gift-aid", "carry-forward"],
        ),
    ]
    session.add_all(meeting_notes)

    # ── Conversation + Messages ─────────────────────────────────────────
    now = datetime.now(timezone.utc)

    conversation = Conversation(
        id="conv-1",
        user_id="demo-user",
        client_id="client-sarah",
        title="Tax planning opportunities",
        status="active",
        last_message_preview="Based on Sarah's current position...",
        last_message_at=now,
        message_count=3,
        unread=False,
        tags=["Planning"],
        tax_plan_mode=False,
    )
    session.add(conversation)

    messages = [
        Message(
            id="msg-1",
            conversation_id="conv-1",
            role="assistant",
            content=(
                "I've loaded Sarah Mitchell's profile for 2025/26. "
                "Her current position shows employment income of \u00a3145,000, "
                "dividend income of \u00a332,500, and rental income of \u00a318,000.\n\n"
                "Total gross income: \u00a3195,500\n\n"
                "What would you like to explore?"
            ),
        ),
        Message(
            id="msg-2",
            conversation_id="conv-1",
            role="user",
            content=(
                "What's her current tax liability and are there any obvious "
                "planning opportunities?"
            ),
        ),
        Message(
            id="msg-3",
            conversation_id="conv-1",
            role="assistant",
            content=(
                "Based on Sarah's current position:\n\n"
                "Total tax liability: \u00a352,847\n"
                "Effective tax rate: 27.0%\n"
                "Marginal rate: 40%\n\n"
                "I've identified 3 key opportunities:\n\n"
                "1. Pension contribution headroom \u2014 she has \u00a342,000 unused "
                "annual allowance, which could save up to \u00a316,800\n\n"
                "2. ISA allowance \u2014 \u00a320,000 unused this tax year. Moving "
                "dividend-generating assets into an ISA wrapper would reduce "
                "her dividend tax exposure\n\n"
                "3. HICBC exposure \u2014 salary sacrifice into pension could "
                "eliminate the High Income Child Benefit Charge\n\n"
                "Shall I model any of these scenarios?"
            ),
            insights=[
                {"label": "Pension", "value": "\u00a316,800", "color": "emerald"},
                {"label": "ISA", "value": "\u00a31,520", "color": "brand"},
                {"label": "HICBC", "value": "\u00a3860", "color": "amber"},
            ],
        ),
    ]
    session.add_all(messages)

    await session.commit()
    logger.info("Demo data seeded successfully")

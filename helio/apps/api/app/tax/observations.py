"""Observations detector.

Threshold-based rules that inspect engine output and generate
alerts, warnings, and optimisation opportunities.
"""

from app.tax.types import (
    ANIResult,
    HICBCResult,
    IncomeTaxResult,
    NIResult,
    ObservationItem,
    PAStatus,
    PensionAAResult,
)


def detect_observations(
    ani: ANIResult,
    income_tax: IncomeTaxResult,
    ni: NIResult,
    hicbc: HICBCResult | None,
    pension_aa: PensionAAResult | None,
    *,
    total_income: float,
    pension_contributions: float = 0,
) -> list[ObservationItem]:
    """Detect tax observations from engine results."""
    obs: list[ObservationItem] = []

    # PA taper zone
    if ani.pa_status == PAStatus.TAPERED:
        excess = ani.adjusted_net_income - 100_000
        obs.append(ObservationItem(
            id="pa-taper-zone",
            title="Personal Allowance Taper Zone",
            description=(
                f"Your ANI of £{ani.adjusted_net_income:,.0f} is in the PA taper zone "
                f"(£100,000–£125,140). You're losing £{ani.personal_allowance_lost:,.0f} "
                f"of your Personal Allowance, creating an effective 60% marginal rate."
            ),
            severity="warning",
            category="income_tax",
            potential_saving=ani.personal_allowance_lost * 0.40,
            action=(
                f"Consider increasing pension contributions by £{excess:,.0f} "
                f"to reduce ANI below £100,000 and restore full PA."
            ),
        ))

    # PA fully lost
    if ani.pa_status == PAStatus.LOST:
        obs.append(ObservationItem(
            id="pa-lost",
            title="Personal Allowance Fully Lost",
            description=(
                f"Your ANI of £{ani.adjusted_net_income:,.0f} exceeds £125,140. "
                f"Your entire £12,570 Personal Allowance has been lost."
            ),
            severity="warning",
            category="income_tax",
        ))

    # HICBC
    if hicbc and hicbc.applies:
        obs.append(ObservationItem(
            id="hicbc-applies",
            title="High Income Child Benefit Charge",
            description=(
                f"HICBC applies at {hicbc.clawback_percentage:.0f}% clawback. "
                f"Charge of £{hicbc.hicbc_charge:,.2f} against "
                f"£{hicbc.child_benefit_annual:,.2f} annual benefit."
            ),
            severity="warning",
            category="child_benefit",
            potential_saving=hicbc.hicbc_charge,
            action=(
                "Salary sacrifice could reduce ANI below £60,000 threshold "
                "and eliminate the HICBC charge."
            ),
        ))

    # Pension headroom
    if pension_aa and pension_aa.remaining > 0:
        # Estimate saving at marginal rate
        marginal_rate = _estimate_marginal_rate(ani, income_tax)
        potential = pension_aa.remaining * marginal_rate
        obs.append(ObservationItem(
            id="pension-headroom",
            title="Pension Contribution Headroom",
            description=(
                f"You have £{pension_aa.remaining:,.0f} of unused pension annual "
                f"allowance (including carry forward)."
            ),
            severity="opportunity",
            category="pension",
            potential_saving=potential if potential > 0 else None,
            action=(
                f"Additional pension contributions could save up to "
                f"£{potential:,.0f} in tax at your {marginal_rate:.0%} marginal rate."
            ),
        ))

    # Approaching AA limit
    if pension_aa and pension_aa.remaining < 10_000 and pension_contributions > 0:
        obs.append(ObservationItem(
            id="pension-aa-limit",
            title="Approaching Pension Annual Allowance Limit",
            description=(
                f"Only £{pension_aa.remaining:,.0f} remaining of your "
                f"£{pension_aa.total_available:,.0f} total available allowance. "
                f"Exceeding this triggers a tax charge."
            ),
            severity="warning",
            category="pension",
        ))

    # ISA reminder (always an opportunity if income exists)
    if total_income > 0:
        obs.append(ObservationItem(
            id="isa-allowance",
            title="ISA Allowance Available",
            description="You can shelter up to £20,000 in an ISA this tax year.",
            severity="info",
            category="savings",
        ))

    return obs


def _estimate_marginal_rate(ani: ANIResult, income_tax: IncomeTaxResult) -> float:
    """Estimate marginal tax rate from the highest non-empty band."""
    # Check non-savings bands (most common)
    if income_tax.non_savings_bands:
        highest = income_tax.non_savings_bands[-1]
        rate = highest.rate
        # In PA taper zone, effective rate is higher
        if ani.in_taper_zone:
            return 0.60
        return rate
    return 0.20  # default to basic rate

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
    SavingsBreakdown,
    SavingsBreakdownItem,
    TaxImpactItem,
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
        pa_saving = ani.personal_allowance_lost * 0.40
        ni_saving = excess * 0.02 if excess > 0 else 0
        total_annual = pa_saving + ni_saving
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
            potential_saving=total_annual,
            action=(
                f"Consider increasing pension contributions by £{excess:,.0f} "
                f"to reduce ANI below £100,000 and restore full PA."
            ),
            savings_breakdown=SavingsBreakdown(
                current_state=[
                    SavingsBreakdownItem("Adjusted Net Income", f"£{ani.adjusted_net_income:,.0f}"),
                    SavingsBreakdownItem("Personal Allowance", f"£{ani.personal_allowance:,.0f} (tapered)"),
                    SavingsBreakdownItem("PA lost", f"£{ani.personal_allowance_lost:,.0f}"),
                ],
                recommended_action=[
                    SavingsBreakdownItem("Increase pension by", f"£{excess:,.0f}"),
                    SavingsBreakdownItem("ANI drops to", "£100,000"),
                    SavingsBreakdownItem("PA restored", "£12,570 (full)"),
                ],
                tax_impact=[
                    TaxImpactItem("Income tax saved (60% band)", pa_saving, pa_saving / 12),
                    TaxImpactItem("NI saved", ni_saving, ni_saving / 12),
                ],
                total_annual=total_annual,
                total_monthly=total_annual / 12,
                cost_note=f"Net take-home reduces but pension pot grows by £{excess:,.0f} more.",
                model_prompt=f"Model salary sacrifice increase of £{excess:,.0f} to restore my personal allowance",
            ),
        ))

    # PA fully lost
    if ani.pa_status == PAStatus.LOST:
        excess_over_restore = ani.adjusted_net_income - 125_140
        pa_saving = 12_570 * 0.40
        obs.append(ObservationItem(
            id="pa-lost",
            title="Personal Allowance Fully Lost",
            description=(
                f"Your ANI of £{ani.adjusted_net_income:,.0f} exceeds £125,140. "
                f"Your entire £12,570 Personal Allowance has been lost."
            ),
            severity="warning",
            category="income_tax",
            potential_saving=pa_saving,
            action=(
                f"Increase pension contributions by £{excess_over_restore:,.0f} "
                f"to reduce ANI to £125,140 and begin restoring PA."
            ),
            savings_breakdown=SavingsBreakdown(
                current_state=[
                    SavingsBreakdownItem("Adjusted Net Income", f"£{ani.adjusted_net_income:,.0f}"),
                    SavingsBreakdownItem("Personal Allowance", "£0 (fully lost)"),
                    SavingsBreakdownItem("Excess above £125,140", f"£{excess_over_restore:,.0f}"),
                ],
                recommended_action=[
                    SavingsBreakdownItem("Increase pension by", f"£{excess_over_restore:,.0f}"),
                    SavingsBreakdownItem("ANI drops to", "£125,140"),
                    SavingsBreakdownItem("PA restoration begins", "Up to £12,570"),
                ],
                tax_impact=[
                    TaxImpactItem("Income tax saved (PA restoration)", pa_saving, pa_saving / 12),
                ],
                total_annual=pa_saving,
                total_monthly=pa_saving / 12,
                cost_note=f"Sacrifice £{excess_over_restore:,.0f} more to start restoring PA. Full restoration requires ANI ≤ £100,000.",
                model_prompt=f"Model salary sacrifice increase of £{excess_over_restore:,.0f} to restore my personal allowance",
            ),
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
            savings_breakdown=SavingsBreakdown(
                current_state=[
                    SavingsBreakdownItem("Adjusted Net Income", f"£{ani.adjusted_net_income:,.0f}"),
                    SavingsBreakdownItem("Child Benefit annual", f"£{hicbc.child_benefit_annual:,.2f}"),
                    SavingsBreakdownItem("Clawback", f"{hicbc.clawback_percentage:.0f}%"),
                    SavingsBreakdownItem("HICBC charge", f"£{hicbc.hicbc_charge:,.2f}"),
                ],
                recommended_action=[
                    SavingsBreakdownItem("Reduce ANI below", "£60,000"),
                    SavingsBreakdownItem("HICBC charge becomes", "£0"),
                    SavingsBreakdownItem("Benefit retained", f"£{hicbc.child_benefit_annual:,.2f}/yr"),
                ],
                tax_impact=[
                    TaxImpactItem("HICBC charge avoided", hicbc.hicbc_charge, hicbc.hicbc_charge / 12),
                ],
                total_annual=hicbc.hicbc_charge,
                total_monthly=hicbc.hicbc_charge / 12,
                cost_note="Reduce ANI via pension sacrifice or other deductions to eliminate the charge entirely.",
                model_prompt="Model salary sacrifice to reduce ANI below £60,000 to avoid HICBC",
            ),
        ))

    # Pension headroom
    if pension_aa and pension_aa.remaining > 0:
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
            savings_breakdown=SavingsBreakdown(
                current_state=[
                    SavingsBreakdownItem("Pension AA remaining", f"£{pension_aa.remaining:,.0f}"),
                    SavingsBreakdownItem("Current contributions", f"£{pension_contributions:,.0f}"),
                    SavingsBreakdownItem("Marginal tax rate", f"{marginal_rate:.0%}"),
                ],
                recommended_action=[
                    SavingsBreakdownItem("Max additional contribution", f"£{pension_aa.remaining:,.0f}"),
                    SavingsBreakdownItem("Tax relief at marginal rate", f"{marginal_rate:.0%}"),
                ],
                tax_impact=[
                    TaxImpactItem("Tax relief on contributions", potential, potential / 12),
                ],
                total_annual=potential,
                total_monthly=potential / 12,
                model_prompt=f"Model increasing pension contributions by £{pension_aa.remaining:,.0f}",
            ) if potential > 0 else None,
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

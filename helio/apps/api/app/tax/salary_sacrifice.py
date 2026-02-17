"""Salary sacrifice analysis.

Models the tax + NI savings from redirecting salary into
employer pension contributions via salary sacrifice arrangement.
Calls compute_full_tax_position twice (current vs proposed) and diffs.
"""

import structlog

from app.tax.engine import compute_full_tax_position
from app.tax.rounding import round_currency
from app.tax.types import IncomeSource, IncomeType

logger = structlog.get_logger(__name__)


def analyse_salary_sacrifice(
    gross_salary: float,
    sacrifice_amount: float,
    *,
    current_sacrifice: float = 0,
    other_income_sources: list[IncomeSource] | None = None,
    region: str = "england",
    number_of_children: int = 0,
    claims_child_benefit: bool = False,
) -> dict:
    """Analyse salary sacrifice tax savings.

    Computes current and proposed tax positions, returns the diff.
    """
    other = other_income_sources or []

    # Current position: salary already reduced by sacrifice.
    # Sacrifice is an EMPLOYER contribution — do NOT pass as
    # pension_contributions (which reduces ANI again). Instead use
    # employer_contributions so it counts toward pension AA only.
    current_sources = [
        IncomeSource(IncomeType.EMPLOYMENT, gross_salary - current_sacrifice, "Employment"),
        *other,
    ]
    current = compute_full_tax_position(
        income_sources=current_sources,
        employer_contributions=current_sacrifice,
        region=region,
        number_of_children=number_of_children,
        claims_child_benefit=claims_child_benefit,
    )

    # Proposed position: salary with new sacrifice
    proposed_sources = [
        IncomeSource(IncomeType.EMPLOYMENT, gross_salary - sacrifice_amount, "Employment"),
        *other,
    ]
    proposed = compute_full_tax_position(
        income_sources=proposed_sources,
        employer_contributions=sacrifice_amount,
        region=region,
        number_of_children=number_of_children,
        claims_child_benefit=claims_child_benefit,
    )

    # Compute savings
    it_saving = round_currency(current.income_tax - proposed.income_tax)
    ni_saving = round_currency(current.national_insurance - proposed.national_insurance)

    current_hicbc = current.hicbc_result.hicbc_charge if current.hicbc_result else 0
    proposed_hicbc = proposed.hicbc_result.hicbc_charge if proposed.hicbc_result else 0
    hicbc_avoided = round_currency(current_hicbc - proposed_hicbc)

    total_saving = round_currency(it_saving + ni_saving + hicbc_avoided)
    extra_pension = round_currency(sacrifice_amount - current_sacrifice)

    logger.info(
        "Salary sacrifice analysed",
        it_saving=it_saving,
        ni_saving=ni_saving,
        hicbc_avoided=hicbc_avoided,
        total=total_saving,
    )

    return {
        "current": {
            "gross_salary": gross_salary,
            "sacrifice": current_sacrifice,
            "income_tax": current.income_tax,
            "national_insurance": current.national_insurance,
            "hicbc": current_hicbc,
            "total_tax": current.total_tax,
            "personal_allowance": current.personal_allowance,
        },
        "proposed": {
            "gross_salary": gross_salary,
            "sacrifice": sacrifice_amount,
            "income_tax": proposed.income_tax,
            "national_insurance": proposed.national_insurance,
            "hicbc": proposed_hicbc,
            "total_tax": proposed.total_tax,
            "personal_allowance": proposed.personal_allowance,
        },
        "savings": {
            "income_tax": it_saving,
            "national_insurance": ni_saving,
            "hicbc_avoided": hicbc_avoided,
            "total": total_saving,
        },
        "pa_change": {
            "current": current.personal_allowance,
            "proposed": proposed.personal_allowance,
            "restored": round_currency(proposed.personal_allowance - current.personal_allowance),
        },
        "extra_into_pension": extra_pension,
    }

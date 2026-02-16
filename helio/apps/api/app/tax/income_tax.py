"""Income tax calculator.

Computes income tax liability for England/Wales/NI and Scotland,
handling the income ordering rule (non-savings, savings, dividends),
personal allowance tapering, and marginal rate calculations.
"""


def calculate_income_tax(
    total_income: float,
    *,
    is_scottish: bool = False,
    pension_contributions: float = 0,
    gift_aid: float = 0,
) -> dict[str, float]:
    """Calculate income tax liability (placeholder — Milestone 3)."""
    raise NotImplementedError

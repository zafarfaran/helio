"""Adjusted Net Income (ANI) calculator.

ANI = Total Income - Gross pension contributions - Gift Aid (grossed up)
Used to determine: PA tapering, HICBC, pension AA taper.
"""


def calculate_adjusted_net_income(
    total_income: float,
    *,
    pension_contributions: float = 0,
    gift_aid: float = 0,
) -> dict[str, float]:
    """Calculate Adjusted Net Income (placeholder)."""
    raise NotImplementedError

"""Pension Annual Allowance calculator.

Handles standard AA (£60,000), tapered AA for high earners,
Money Purchase AA (£10,000), and 3-year carry forward.
"""


def calculate_pension_aa(
    adjusted_income: float,
    threshold_income: float,
    *,
    contributions_by_year: dict[str, float] | None = None,
    mpaa_triggered: bool = False,
) -> dict[str, float]:
    """Calculate available pension annual allowance (placeholder)."""
    raise NotImplementedError

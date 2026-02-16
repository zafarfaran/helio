"""High Income Child Benefit Charge (HICBC) calculator.

HICBC applies when ANI exceeds £60,000. The charge equals
1% of child benefit for every £200 of income over £60,000,
reaching 100% at £80,000.
"""


def calculate_hicbc(
    adjusted_net_income: float,
    *,
    annual_child_benefit: float = 0,
) -> dict[str, float]:
    """Calculate HICBC (placeholder)."""
    raise NotImplementedError

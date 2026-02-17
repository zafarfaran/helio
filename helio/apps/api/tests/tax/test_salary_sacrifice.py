"""Tests for salary sacrifice analysis."""

from app.tax.salary_sacrifice import analyse_salary_sacrifice
from app.tax.types import IncomeSource, IncomeType


def test_salary_sacrifice_basic():
    """£100k salary, propose £20k sacrifice. Should save IT + NI."""
    r = analyse_salary_sacrifice(100_000, 20_000)
    assert r["savings"]["income_tax"] > 0
    assert r["savings"]["national_insurance"] > 0
    assert r["savings"]["total"] > 0
    assert r["extra_into_pension"] == 20_000


def test_salary_sacrifice_restores_pa():
    """£112k salary, sacrifice £12k to get ANI to £100k → PA restored."""
    r = analyse_salary_sacrifice(112_000, 12_000)
    # Current: ANI=112k, PA tapered. Proposed: ANI=100k, PA full.
    assert r["pa_change"]["current"] < 12_570
    assert r["pa_change"]["proposed"] == 12_570
    assert r["pa_change"]["restored"] > 0


def test_salary_sacrifice_eliminates_hicbc():
    """£70k + children, sacrifice enough to get ANI < £60k → HICBC eliminated."""
    r = analyse_salary_sacrifice(
        70_000, 10_000,
        number_of_children=2,
        claims_child_benefit=True,
    )
    assert r["savings"]["hicbc_avoided"] > 0
    assert r["savings"]["total"] > 0

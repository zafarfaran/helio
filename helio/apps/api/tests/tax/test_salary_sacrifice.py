"""Tests for salary sacrifice analysis."""

from app.tax.salary_sacrifice import analyse_salary_sacrifice
from app.tax.types import IncomeSource, IncomeType


def test_salary_sacrifice_basic():
    """£100k salary, propose £20k sacrifice. Should save IT + NI."""
    r, _ = analyse_salary_sacrifice(100_000, 20_000)
    assert r["savings"]["income_tax"] > 0
    assert r["savings"]["national_insurance"] > 0
    assert r["savings"]["total"] > 0
    assert r["extra_into_pension"] == 20_000


def test_salary_sacrifice_restores_pa():
    """£112k salary, sacrifice £12k to get ANI to £100k → PA restored."""
    r, _ = analyse_salary_sacrifice(112_000, 12_000)
    # Current: ANI=112k, PA tapered. Proposed: ANI=100k, PA full.
    assert r["pa_change"]["current"] < 12_570
    assert r["pa_change"]["proposed"] == 12_570
    assert r["pa_change"]["restored"] > 0


def test_salary_sacrifice_eliminates_hicbc():
    """£70k + children, sacrifice enough to get ANI < £60k → HICBC eliminated."""
    r, _ = analyse_salary_sacrifice(
        70_000, 10_000,
        number_of_children=2,
        claims_child_benefit=True,
    )
    assert r["savings"]["hicbc_avoided"] > 0
    assert r["savings"]["total"] > 0


def test_salary_sacrifice_net_benefit():
    """£100k salary, sacrifice £20k. Net benefit shows take-home reduction vs pension gained."""
    r, _ = analyse_salary_sacrifice(100_000, 20_000)

    nb = r["net_benefit"]
    assert nb["gross_into_pension"] == 20_000
    assert nb["income_tax_saved"] == r["savings"]["income_tax"]
    assert nb["ni_saved"] == r["savings"]["national_insurance"]
    assert nb["hicbc_avoided"] == r["savings"]["hicbc_avoided"]
    assert nb["total_saving"] == r["savings"]["total"]
    assert nb["take_home_reduction"] == 20_000 - r["savings"]["total"]
    assert 0 < nb["effective_cost_per_pound_in_pension"] < 1


def test_salary_sacrifice_net_benefit_with_hicbc():
    """£70k + children, sacrifice £10k. Net benefit includes HICBC saving."""
    r, _ = analyse_salary_sacrifice(
        70_000, 10_000,
        number_of_children=2,
        claims_child_benefit=True,
    )

    nb = r["net_benefit"]
    assert nb["gross_into_pension"] == 10_000
    assert nb["hicbc_avoided"] > 0
    assert nb["total_saving"] == nb["income_tax_saved"] + nb["ni_saved"] + nb["hicbc_avoided"]
    assert nb["take_home_reduction"] == 10_000 - nb["total_saving"]


def test_salary_sacrifice_net_benefit_existing_sacrifice():
    """Already sacrificing £5k, propose £15k. Net benefit based on additional £10k."""
    r, _ = analyse_salary_sacrifice(100_000, 15_000, current_sacrifice=5_000)

    nb = r["net_benefit"]
    # Net benefit is on the ADDITIONAL sacrifice
    assert nb["gross_into_pension"] == 10_000  # 15k - 5k
    assert nb["total_saving"] == r["savings"]["total"]
    assert nb["take_home_reduction"] == 10_000 - nb["total_saving"]

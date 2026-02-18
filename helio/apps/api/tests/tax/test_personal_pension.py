"""Tests for personal pension contribution analysis."""

from app.tax.personal_pension import analyse_personal_pension
from app.tax.types import IncomeSource, IncomeType


def test_basic_income_tax_saving():
    """£80k salary, propose £10k pension contribution. Should save income tax."""
    sources = [IncomeSource(IncomeType.EMPLOYMENT, 80_000, "Employment")]
    r = analyse_personal_pension(sources, proposed_contribution=10_000)

    assert r["savings"]["income_tax"] > 0
    assert r["savings"]["total"] > 0
    # Personal pension does NOT save NI
    assert r["current"]["national_insurance"] == r["proposed"]["national_insurance"]
    assert r["proposed"]["pension_contribution"] == 10_000
    assert r["current"]["pension_contribution"] == 0


def test_pa_taper_restoration():
    """£125k salary, contribute £25,140 to bring ANI to £100k. PA fully restored."""
    sources = [IncomeSource(IncomeType.EMPLOYMENT, 125_140, "Employment")]
    r = analyse_personal_pension(sources, proposed_contribution=25_140)

    # Current: ANI=125,140 → PA=0. Proposed: ANI=100,000 → PA=12,570.
    assert r["pa_change"]["current"] == 0
    assert r["pa_change"]["proposed"] == 12_570
    assert r["pa_change"]["restored"] == 12_570


def test_hicbc_avoidance():
    """£70k salary + 2 children, contribute £10k to bring ANI to £60k → HICBC eliminated."""
    sources = [IncomeSource(IncomeType.EMPLOYMENT, 70_000, "Employment")]
    r = analyse_personal_pension(
        sources,
        proposed_contribution=10_000,
        number_of_children=2,
        claims_child_benefit=True,
    )
    assert r["savings"]["hicbc_avoided"] > 0
    assert r["savings"]["total"] > 0


def test_threshold_identification():
    """£120k salary should identify PA taper and higher-rate thresholds."""
    sources = [IncomeSource(IncomeType.EMPLOYMENT, 120_000, "Employment")]
    r = analyse_personal_pension(sources, proposed_contribution=5_000)

    thresholds = r["thresholds"]
    assert len(thresholds) > 0

    # Should have a PA taper threshold
    pa_thresh = [t for t in thresholds if "PA taper" in t["name"]]
    assert len(pa_thresh) == 1
    assert pa_thresh[0]["contribution_needed"] == 20_000  # 120k - 100k
    assert pa_thresh[0]["annual_saving"] > 0


def test_threshold_hicbc_with_children():
    """£75k salary + children should identify HICBC threshold at £60k ANI."""
    sources = [IncomeSource(IncomeType.EMPLOYMENT, 75_000, "Employment")]
    r = analyse_personal_pension(
        sources,
        proposed_contribution=5_000,
        number_of_children=2,
        claims_child_benefit=True,
    )

    hicbc_thresh = [t for t in r["thresholds"] if "HICBC" in t["name"]]
    assert len(hicbc_thresh) == 1
    assert hicbc_thresh[0]["contribution_needed"] == 15_000  # 75k - 60k


def test_pension_aa_warning():
    """Contribution exceeding AA should generate a warning."""
    sources = [IncomeSource(IncomeType.EMPLOYMENT, 200_000, "Employment")]
    r = analyse_personal_pension(sources, proposed_contribution=65_000)

    assert r["pension_aa_warning"] is not None


def test_existing_contribution_increase():
    """Already contributing £5k, propose increasing to £15k."""
    sources = [IncomeSource(IncomeType.EMPLOYMENT, 80_000, "Employment")]
    r = analyse_personal_pension(
        sources,
        proposed_contribution=15_000,
        current_contribution=5_000,
    )
    assert r["current"]["pension_contribution"] == 5_000
    assert r["proposed"]["pension_contribution"] == 15_000
    assert r["savings"]["total"] > 0


def test_effective_relief_rate():
    """Effective relief rate should be saving / additional contribution * 100."""
    sources = [IncomeSource(IncomeType.EMPLOYMENT, 80_000, "Employment")]
    r = analyse_personal_pension(sources, proposed_contribution=10_000)

    expected_rate = r["savings"]["total"] / 10_000 * 100
    assert abs(r["effective_relief_rate"] - expected_rate) < 0.01


def test_multiple_income_sources():
    """Should work with employment + dividends + rental."""
    sources = [
        IncomeSource(IncomeType.EMPLOYMENT, 100_000, "Employment"),
        IncomeSource(IncomeType.DIVIDENDS, 20_000, "Dividends"),
        IncomeSource(IncomeType.RENTAL, 15_000, "Rental"),
    ]
    r = analyse_personal_pension(sources, proposed_contribution=10_000)
    assert r["savings"]["total"] > 0
    # With £135k total income, PA taper threshold should appear
    pa_thresh = [t for t in r["thresholds"] if "PA taper" in t["name"]]
    assert len(pa_thresh) == 1

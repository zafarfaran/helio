"""Tests for the PDF report generation service."""

import io

from app.services.pdf_report import generate_tax_report


# ---------------------------------------------------------------------------
# Shared test fixtures
# ---------------------------------------------------------------------------

def _full_client() -> dict:
    return {
        "name": "Sarah Chen",
        "email": "sarah@example.com",
        "niNumber": "QQ 12 34 56 A",
        "region": "England",
        "employmentStatus": "Employed",
    }


def _full_tax_position() -> dict:
    return {"taxYear": "2024/25"}


def _full_dashboard_data() -> dict:
    return {
        "taxYear": "2024/25",
        "incomeSummary": {
            "totalGrossIncome": 95_000,
            "sources": [
                {"label": "Employment Income", "amount": 85_000},
                {"label": "Rental Income", "amount": 10_000},
            ],
        },
        "taxCalculation": {
            "totalIncomeTax": 20_188,
            "incomeTaxByBand": [
                {"band": "Personal Allowance", "income": 12_570, "rate": 0, "tax": 0},
                {"band": "Basic Rate", "income": 37_700, "rate": 20, "tax": 7_540},
                {"band": "Higher Rate", "income": 44_730, "rate": 40, "tax": 17_892},
                {"band": "Additional Rate", "income": 0, "rate": 45, "tax": 0},
            ],
        },
        "nationalInsurance": {
            "class1": 4_964.16,
            "class2": 0,
            "class4": 0,
            "totalNI": 4_964.16,
        },
        "adjustedNetIncome": {
            "totalIncome": 95_000,
            "deductions": 0,
            "adjustedNetIncome": 95_000,
            "personalAllowance": 12_570,
            "paStatus": "full",
        },
        "hicbc": {"applies": False},
        "taxSummary": {
            "incomeTax": 20_188,
            "nationalInsurance": 4_964.16,
            "hicbc": 0,
            "totalTax": 25_152.16,
        },
        "effectiveRate": 26.5,
        "marginalRate": 40,
        "observations": [
            {
                "severity": "opportunity",
                "title": "Pension Contribution Opportunity",
                "description": "Consider salary sacrifice to reduce higher-rate tax liability.",
                "potentialSaving": 3_200,
                "action": "Discuss pension sacrifice options with employer.",
            },
            {
                "severity": "warning",
                "title": "Approaching PA Taper Zone",
                "description": "Income above \u00a3100,000 will trigger personal allowance taper.",
                "potentialSaving": None,
                "action": "Monitor total income carefully.",
            },
        ],
    }


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_generate_pdf_returns_bytes() -> None:
    """Full data generates a valid PDF returned as BytesIO."""
    result = generate_tax_report(
        client=_full_client(),
        tax_position=_full_tax_position(),
        dashboard_data=_full_dashboard_data(),
    )

    assert isinstance(result, io.BytesIO)
    header = result.read(5)
    assert header == b"%PDF-"


def test_generate_pdf_with_hicbc() -> None:
    """PDF generates successfully when HICBC data is included."""
    dashboard = _full_dashboard_data()
    dashboard["hicbc"] = {
        "applies": True,
        "childBenefitAnnual": 2_075,
        "clawbackPercent": 50,
        "charge": 1_037.50,
        "netBenefit": 1_037.50,
    }
    dashboard["taxSummary"]["hicbc"] = 1_037.50
    dashboard["taxSummary"]["totalTax"] = 26_189.66

    result = generate_tax_report(
        client=_full_client(),
        tax_position=_full_tax_position(),
        dashboard_data=dashboard,
    )

    assert isinstance(result, io.BytesIO)
    data = result.read()
    assert data[:5] == b"%PDF-"
    assert len(data) > 1000  # non-trivial PDF


def test_generate_pdf_with_scenarios() -> None:
    """PDF generates successfully when scenario comparison data is provided."""
    scenarios = [
        {
            "name": "Salary Sacrifice \u00a310,000",
            "current": {
                "grossSalary": 85_000,
                "salarySacrifice": 0,
                "incomeTax": 20_188,
                "nationalInsurance": 4_964.16,
                "hicbc": 0,
                "totalTax": 25_152.16,
            },
            "proposed": {
                "grossSalary": 75_000,
                "salarySacrifice": 10_000,
                "incomeTax": 16_188,
                "nationalInsurance": 4_164.16,
                "hicbc": 0,
                "totalTax": 20_352.16,
                "extraPension": 10_000,
            },
        },
    ]

    result = generate_tax_report(
        client=_full_client(),
        tax_position=_full_tax_position(),
        dashboard_data=_full_dashboard_data(),
        scenarios=scenarios,
    )

    assert isinstance(result, io.BytesIO)
    data = result.read()
    assert data[:5] == b"%PDF-"
    assert len(data) > 1000


def test_generate_pdf_minimal_data() -> None:
    """PDF generates successfully with minimal client and dashboard data."""
    minimal_client = {"name": "Test User"}
    minimal_tax_position = {"taxYear": "2024/25"}
    minimal_dashboard = {
        "incomeSummary": {
            "totalGrossIncome": 30_000,
            "sources": [{"label": "Employment", "amount": 30_000}],
        },
        "taxCalculation": {
            "totalIncomeTax": 3_486,
            "incomeTaxByBand": [
                {"band": "Personal Allowance", "income": 12_570, "rate": 0, "tax": 0},
                {"band": "Basic Rate", "income": 17_430, "rate": 20, "tax": 3_486},
            ],
        },
        "nationalInsurance": {"totalNI": 0},
        "hicbc": {"applies": False},
        "effectiveRate": 11.6,
        "marginalRate": 20,
    }

    result = generate_tax_report(
        client=minimal_client,
        tax_position=minimal_tax_position,
        dashboard_data=minimal_dashboard,
    )

    assert isinstance(result, io.BytesIO)
    data = result.read()
    assert data[:5] == b"%PDF-"
    assert len(data) > 500

"""System prompt loader with client context injection."""

import json
from pathlib import Path

from app.core.logging import get_logger

logger = get_logger(__name__)

_BASE_PROMPT: str | None = None

_FALLBACK_PROMPT = """You are Helio, an expert UK tax planning assistant for financial advisers. You help advisers understand their clients' tax positions, identify planning opportunities, and run scenario analyses.

You are knowledgeable about UK income tax, National Insurance, Capital Gains Tax, Inheritance Tax, pensions, ISAs, and all relevant allowances and reliefs.

## Current Client Context

{{CLIENT_CONTEXT}}
"""

_TOOL_INSTRUCTIONS = """
## Dashboard Tool

You have access to the `generate_dashboard` tool. You MUST use this tool whenever the adviser asks you to:
- Analyse a client's tax position
- Show a tax breakdown or summary
- Review allowances
- Identify observations, warnings, or planning opportunities
- Run a tax plan or scenario analysis
- Provide a full overview or dashboard

When using `generate_dashboard`, populate `relevantTaxData` with ALL relevant structured data derived from the client context above. Structure it as follows:

```json
{
  "mode": "reset",
  "relevantTaxData": {
    "incomeSummary": {
      "totalIncome": 125000,
      "sources": [
        {"type": "employment", "label": "Employment", "amount": 110000},
        {"type": "dividends", "label": "Dividends", "amount": 15000}
      ]
    },
    "adjustedNetIncome": {
      "amount": 125000,
      "personalAllowanceStatus": "Tapered"
    },
    "taxCalculation": {
      "totalIncomeTax": 33500,
      "totalTax": 39000,
      "effectiveRate": 31.2,
      "marginalRate": 40,
      "incomeTaxByBand": [
        {"band": "Personal Allowance", "amount": 0, "rate": 0, "tax": 0},
        {"band": "Basic Rate", "amount": 37700, "rate": 0.2, "tax": 7540},
        {"band": "Higher Rate", "amount": 87300, "rate": 0.4, "tax": 25960}
      ]
    },
    "nationalInsurance": {
      "class1": 5500,
      "class2": 0,
      "class4": 0
    },
    "allowancesTracker": {
      "allowances": [
        {"name": "Personal Allowance", "annualLimit": 12570, "used": 12570, "remaining": 0, "status": "RED"},
        {"name": "ISA Allowance", "annualLimit": 20000, "used": 12000, "remaining": 8000, "status": "AMBER"},
        {"name": "Pension Annual Allowance", "annualLimit": 60000, "used": 15000, "remaining": 45000, "status": "GREEN"},
        {"name": "CGT Annual Exempt Amount", "annualLimit": 3000, "used": 0, "remaining": 3000, "status": "GREEN"},
        {"name": "Dividend Allowance", "annualLimit": 500, "used": 500, "remaining": 0, "status": "RED"}
      ]
    },
    "observations": [
      {"type": "warning", "title": "PA Taper Zone", "description": "Income exceeds £100k — personal allowance is being tapered", "action": "Consider pension contributions to reduce ANI below £100k"},
      {"type": "opportunity", "title": "Pension Contribution", "description": "£45k pension allowance unused — contributing would save up to £18k in tax", "potentialSaving": 18000, "action": "Maximise pension contributions before year end"}
    ]
  }
}
```

Use the client data provided in the context above to populate accurate figures. Always call the tool BEFORE writing your text response so the dashboard updates appear immediately. After the tool call, provide a brief text summary of the key findings.
"""


def _load_base_prompt() -> str:
    """Load and cache the base system prompt from docs/system_prompt.md."""
    global _BASE_PROMPT
    if _BASE_PROMPT is None:
        # Try multiple paths (handles different working directories)
        paths = [
            Path(__file__).resolve().parents[5] / "docs" / "system_prompt.md",
            Path(__file__).resolve().parents[4] / "docs" / "system_prompt.md",
            Path("docs/system_prompt.md"),
        ]
        for p in paths:
            if p.exists():
                _BASE_PROMPT = p.read_text(encoding="utf-8")
                logger.info("System prompt loaded", path=str(p), length=len(_BASE_PROMPT))
                return _BASE_PROMPT
        # Fallback
        _BASE_PROMPT = _FALLBACK_PROMPT
        logger.warning("System prompt file not found, using fallback")
    return _BASE_PROMPT


def build_system_prompt(
    client_context: dict | None = None,
    tax_plan_mode: bool = False,
) -> str:
    """Build the full system prompt with optional client context and tool instructions."""
    base = _load_base_prompt()

    if client_context:
        context_text = _format_client_context(client_context)
    else:
        context_text = "No client currently selected. Ask the adviser which client they'd like to discuss."

    prompt = base.replace("{{CLIENT_CONTEXT}}", context_text)

    # Add tool usage instructions when tax plan mode is enabled
    if tax_plan_mode:
        prompt += _TOOL_INSTRUCTIONS

    logger.debug(
        "System prompt built",
        has_client=client_context is not None,
        tax_plan_mode=tax_plan_mode,
        length=len(prompt),
    )
    return prompt


def _format_client_context(ctx: dict) -> str:
    """Format client tax data as readable context for the LLM."""
    lines = []

    if "client" in ctx:
        c = ctx["client"]
        lines.append(f"**Client:** {c.get('first_name', '')} {c.get('last_name', '')}")
        lines.append(f"**Region:** {c.get('region', 'england').title()}")
        lines.append(f"**Employment status:** {c.get('employment_status', 'employed')}")

    if "tax_profile" in ctx:
        tp = ctx["tax_profile"]
        lines.append(f"\n**Tax Year:** {tp.get('tax_year', '2025/26')}")
        lines.append(f"**Total Income:** £{tp.get('total_income', 0):,.2f}")
        lines.append(f"**Adjusted Net Income:** £{tp.get('adjusted_net_income', 0):,.2f}")
        lines.append(f"**Total Tax:** £{tp.get('total_tax', 0):,.2f}")
        lines.append(f"**Effective Rate:** {tp.get('effective_rate', 0):.1f}%")
        lines.append(f"**Marginal Rate:** {tp.get('marginal_rate', 0):.0f}%")
        lines.append(f"**Personal Allowance Status:** {tp.get('pa_status', 'full')}")

        if tp.get('in_pa_taper_zone'):
            lines.append("**Alert:** Client is in the PA taper zone (£100k-£125,140)")
        if tp.get('hicbc_applies'):
            lines.append("**Alert:** HICBC applies")

        if tp.get('income_sources'):
            lines.append("\n**Income Sources:**")
            for src in tp['income_sources']:
                lines.append(f"- {src.get('label', src.get('source_type', 'Unknown'))}: £{src.get('gross_amount', 0):,.2f}")

        if tp.get('allowances'):
            lines.append("\n**Allowances:**")
            for a in tp['allowances']:
                lines.append(f"- {a.get('label', a.get('type', ''))}: £{a.get('remaining', 0):,.0f} remaining of £{a.get('annual_limit', 0):,.0f}")

    if "observations" in ctx:
        lines.append("\n**Current Observations:**")
        for obs in ctx["observations"]:
            lines.append(f"- [{obs.get('severity', 'info').upper()}] {obs.get('title', '')}: {obs.get('description', '')}")

    if "meeting_notes" in ctx:
        notes = ctx["meeting_notes"]
        lines.append(f"\n**Meeting Notes:** {len(notes)} notes on file (use search_meeting_notes tool to retrieve)")
        lines.append("Recent topics:")
        for note in notes[:5]:
            lines.append(f"- {note.get('date', '')} — {note.get('subject', '')}")

    return "\n".join(lines)

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
## Tax Engine Tools

**CRITICAL RULE: You NEVER calculate tax numbers yourself.** All numbers come from the deterministic tax engine via the tools below.

### Workflow
1. Call `compute_tax_position` with the client's income sources and deductions
2. Call `generate_dashboard` with the engine output (pass the `dashboardData` from the result as `taxData`)
3. Explain the results to the adviser in plain language

### compute_tax_position
Use this tool to compute a complete UK tax position. Provide income sources from the client context. The engine returns:
- Income tax with band-by-band breakdown (HMRC-compliant truncation)
- National Insurance (Class 1/2/4 as applicable)
- HICBC charge if applicable
- Pension annual allowance status
- Observations (warnings, opportunities)
- Summary: total_tax, effective_rate, marginal_rate

### model_salary_sacrifice
Use this tool to model the tax impact of salary sacrifice. Provide current salary and proposed sacrifice amount. Returns:
- Current vs proposed tax positions
- Savings breakdown (income tax, NI, HICBC avoided)
- PA restoration if applicable

### generate_dashboard
After calling compute_tax_position, pass the `dashboardData` from the result to generate_dashboard:
```json
{
  "mode": "reset",
  "taxData": <dashboardData from compute_tax_position result>
}
```

Always call the engine tool BEFORE writing your text response so the dashboard updates appear immediately. After the tool call, provide a brief text summary of the key findings.

**Remember: Never invent numbers. If you need a tax calculation, use the tool.**
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

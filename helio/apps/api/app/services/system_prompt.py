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
## Tax Engine — MANDATORY

**ABSOLUTE RULE: You MUST call `compute_tax_position` before quoting ANY tax figure.** Do not calculate, estimate, or repeat numbers from the client context. The client context numbers may be stale. Always call the engine to get the authoritative, up-to-date computation.

This applies to ALL tax-related queries — even simple ones like "what's their effective rate?" or "how much tax do they pay?". Call the tool first, then quote from its output.

### Required Workflow
1. **FIRST** — Call `compute_tax_position` with income sources from the client context
2. The dashboard updates AUTOMATICALLY from the engine output — you do NOT need to call `generate_dashboard` separately
3. **THEN** — Write your text response explaining the results, quoting only the numbers returned by the engine

### compute_tax_position
Computes a complete UK tax position deterministically. Provide:
- `income_sources`: from client context (source_type, gross_amount, label)
- `pension_contributions`: gross personal pension contributions (SIPP / relief at source)
- `employer_contributions`: employer pension contributions (including salary sacrifice)
- `region`: "england" / "scotland" / "wales" / "northern_ireland"
- `number_of_children`, `claims_child_benefit`: for HICBC
- `tax_year`: defaults to "2025/26"

Returns: income tax (band-by-band), NI, HICBC, pension AA, observations, summary.
The dashboard is updated automatically with the engine results.

### model_salary_sacrifice
Models tax impact of salary sacrifice. Use when adviser asks about pension optimisation. Returns current vs proposed position with savings breakdown.

### generate_dashboard
Only use this tool when you need to update the dashboard layout or display WITHOUT re-running the engine (rare). For normal tax queries, `compute_tax_position` already updates the dashboard.

### Pension Contributions — Two Types
- **pension_contributions**: Personal contributions to a SIPP or personal pension (relief at source). These reduce ANI and extend the basic rate band for higher/additional rate tax relief.
- **employer_contributions**: Employer contributions including salary sacrifice. These do NOT reduce ANI (the salary is already reduced), but DO count toward the pension annual allowance.

### Scenarios and Follow-ups — ALWAYS use the tool
Every scenario request MUST call a tool — no exceptions. This includes:
- "What if I sacrifice £10K?" → call `model_salary_sacrifice`
- "Run another scenario with £20K" → call `model_salary_sacrifice` again
- "What about £5K instead?" → call the tool AGAIN, do not interpolate from the last result
- "How does that change if we add gift aid?" → call `compute_tax_position` with the new parameters

**Never derive one scenario from another.** Each scenario MUST be computed independently by the engine. Do not say "since £20K saved X, £10K would save roughly half" — the tax system is non-linear and that logic is wrong. Call the tool every single time.

### What NOT to do
- Do NOT quote total_income, total_tax, effective_rate, or any number without calling the engine first
- Do NOT say "based on the client data, the tax is £X" — call the tool instead
- Do NOT skip the engine because the numbers are already in the conversation — they may be outdated
- Do NOT perform arithmetic on tax bands, rates, allowances, or thresholds yourself
- Do NOT modify or round the engine's numbers before presenting them to the adviser
- Do NOT extrapolate or interpolate from a previous tool call's results — run the engine fresh

### save_observation
Save a notable tax planning insight to the client's permanent record. You don't need to be asked — if you spot something genuinely useful during a computation or conversation, save it. But only when it's worth saving.

**Good reasons to save:**
- A specific, quantified saving opportunity (e.g. "Salary sacrifice of £8,000 would save £3,200/yr")
- A warning about a threshold being breached or approached (PA taper, HICBC)
- A planning consideration that came up in conversation the adviser should track

**Don't save:**
- Generic tax facts the adviser already knows
- Observations the engine already flagged (check the engine output first to avoid duplicates)
- Trivial restatements of computation results
- Anything you're not reasonably confident about
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

    # Always include engine tool instructions so Claude never computes tax itself
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

# System Prompt Restructure — Design

**Date:** 2026-02-20
**Goal:** Restructure the Helio system prompt to (1) prevent proactive scenario execution, (2) add feasibility checks before suggestions, and (3) use XML tags for clear structure.

---

## Approach: XML-Structured Monolith

Merge the base `docs/system_prompt.md` and `_TOOL_INSTRUCTIONS` (from `system_prompt.py`) into a single XML-tagged prompt file. Eliminate the `_TOOL_INSTRUCTIONS` constant from Python.

## XML Section Layout

```
<role>               — Who Helio is, what it does
<background>         — UK tax fundamentals, tax calendar
<analysis_workflow>   — Step-by-step process for analysing tax returns
<tools>              — Tool definitions, inputs, outputs
<scenario_protocol>  — Suggest-then-confirm flow (NEW)
<feasibility_rules>  — Must-check before any suggestion (NEW)
<observations>       — When/how to save observations
<presentation>       — Response formatting, dashboard guidance
<constraints>        — Guardrails, what NOT to do
<confidentiality>    — Absolute confidentiality rules
<client_context>     — Injected at runtime via {{CLIENT_CONTEXT}}
```

## Key Behaviour Changes

### 1. Scenario Protocol (suggest-then-confirm)

**Rule:** Never call `model_salary_sacrifice` or `model_personal_pension` proactively.

**Flow:**
1. Spot the opportunity during tax position analysis
2. Mention it in text: "A pension contribution could restore some Personal Allowance"
3. Ask for confirmation: "Want me to model a salary sacrifice scenario?"
4. Only call the tool after explicit adviser approval

**Exception:** `compute_tax_position` remains mandatory and ungated — always called before quoting any tax figure.

### 2. Feasibility Rules

Before suggesting ANY strategy, verify:

**Employment-based:**
| Strategy | Requires | Infeasible if |
|---|---|---|
| Salary sacrifice | Employed (not self-employed) | Self-employed, contractor, retired |
| Employer pension contributions | Employed | Self-employed |
| Personal pension (SIPP) | Relevant UK earnings | No relevant UK earnings |

**Affordability:**
- Never suggest sacrifice/contribution consuming >50% of take-home without flagging
- Check pension AA headroom before suggesting contributions that exceed it
- Don't suggest topping up already-maxed allowances (ISA, CGT AEA)

**Logical consistency:**
- Don't suggest salary sacrifice AND personal pension for same amount — clarify route
- Don't suggest reducing income below PA threshold when no benefit
- Factor in existing salary sacrifice arrangements

**On failure:** Either don't mention the strategy, or explain why it doesn't apply and suggest an alternative.

### 3. Python Loader Simplification

- Remove `_TOOL_INSTRUCTIONS` constant from `system_prompt.py`
- Remove `prompt += _TOOL_INSTRUCTIONS` line
- Loader just loads `.md` file, injects `{{CLIENT_CONTEXT}}`, returns it

## Files Changed

1. `docs/system_prompt.md` — Full rewrite with XML structure
2. `helio/apps/api/app/services/system_prompt.py` — Remove `_TOOL_INSTRUCTIONS`, simplify `build_system_prompt()`

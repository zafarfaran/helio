# Scenario Modelling — How It Works

> Every "what if" question is just the engine running twice with different inputs. The diff IS the scenario.

---

## The Core Pattern

Every scenario in Helio follows the same pattern:

```
1. Compute CURRENT tax position → TaxPosition A
2. Change one or more inputs
3. Compute PROPOSED tax position → TaxPosition B
4. Diff A and B → savings, PA change, net pay impact
5. Present side-by-side comparison on the Scenarios tab
```

The engine (`compute_full_tax_position`) is deterministic. Same inputs = same outputs. So comparing two positions is guaranteed to produce a meaningful, exact diff.

---

## What's Already Built

```
app/tax/
├── engine.py                ✅ compute_full_tax_position() → TaxPosition
├── salary_sacrifice.py      ✅ analyse_salary_sacrifice() → runs engine 2x, returns diff
├── types.py                 ✅ TaxPosition, all sub-results as frozen dataclasses
├── observations.py          ✅ detect_observations() → flags opportunities
└── bed_and_isa.py           ⬜ Stub (placeholder)
```

`analyse_salary_sacrifice()` is the template for all scenario functions. It:
1. Builds `current_sources` with the existing sacrifice amount
2. Builds `proposed_sources` with the new sacrifice amount
3. Calls `compute_full_tax_position()` twice
4. Diffs income tax, NI, HICBC, personal allowance
5. Returns a structured comparison dict

---

## Scenario Types

### 1. Salary Sacrifice — BUILT

**What changes**: Employment income decreases, employer pension contributions increase.

**Engine calls**:
```python
# Current: salary £145k, sacrifice £6k
current = compute_full_tax_position(
    income_sources=[IncomeSource(EMPLOYMENT, 145_000 - 6_000)],
    employer_contributions=6_000,
    ...
)

# Proposed: salary £145k, sacrifice £18k
proposed = compute_full_tax_position(
    income_sources=[IncomeSource(EMPLOYMENT, 145_000 - 18_000)],
    employer_contributions=18_000,
    ...
)
```

**What the diff shows**:
- Income tax saving (from lower taxable income)
- Employee NI saving (from lower gross pay)
- Employer NI saving (from lower gross pay — the employer keeps this)
- HICBC saving (if ANI drops below thresholds)
- PA restoration (if ANI drops into/below the taper zone)
- Net take-home reduction
- Extra going into pension pot
- Effective relief rate (total tax saved / take-home sacrificed)

**File**: `app/tax/salary_sacrifice.py` — `analyse_salary_sacrifice()`

---

### 2. Personal Pension Contribution — TO BUILD

**What changes**: Personal pension contributions increase. Unlike salary sacrifice, gross pay stays the same, but ANI drops (personal contributions reduce ANI directly).

**How it differs from salary sacrifice**:
- Salary sacrifice: gross pay drops, employer contributes more. NI savings on both sides.
- Personal contribution: gross pay stays, you claim relief. No NI saving (NI based on gross pay). But ANI drops more directly.

**Engine calls**:
```python
# Current: total income £120k, personal pension contributions £5k
current = compute_full_tax_position(
    income_sources=[IncomeSource(EMPLOYMENT, 120_000)],
    pension_contributions=5_000,  # Reduces ANI, extends BRB
    ...
)

# Proposed: same income, personal pension contributions £25k
proposed = compute_full_tax_position(
    income_sources=[IncomeSource(EMPLOYMENT, 120_000)],
    pension_contributions=25_000,  # Reduces ANI by £20k more
    ...
)
```

**What the diff shows**:
- Income tax saving (from extended basic rate band + lower ANI)
- PA restoration (if ANI drops below £125,140 or below £100k)
- HICBC saving (if ANI drops below £80k/£60k)
- No NI saving (NI is on gross employment income, unchanged)
- Net cost (the contribution itself, minus the tax relief)

**New function** — `app/tax/pension_contribution.py`:

```python
def analyse_pension_contribution(
    income_sources: list[IncomeSource],
    current_contributions: float,
    proposed_contributions: float,
    *,
    employer_contributions: float = 0,
    gift_aid: float = 0,
    region: str = "england",
    number_of_children: int = 0,
    claims_child_benefit: bool = False,
) -> dict:
    """Compare tax positions with different personal pension contributions."""
    
    current = compute_full_tax_position(
        income_sources=income_sources,
        pension_contributions=current_contributions,
        employer_contributions=employer_contributions,
        gift_aid=gift_aid,
        region=region,
        number_of_children=number_of_children,
        claims_child_benefit=claims_child_benefit,
    )
    
    proposed = compute_full_tax_position(
        income_sources=income_sources,
        pension_contributions=proposed_contributions,
        employer_contributions=employer_contributions,
        gift_aid=gift_aid,
        region=region,
        number_of_children=number_of_children,
        claims_child_benefit=claims_child_benefit,
    )
    
    extra_contribution = proposed_contributions - current_contributions
    it_saving = current.income_tax - proposed.income_tax
    hicbc_saved = (
        (current.hicbc_result.hicbc_charge if current.hicbc_result else 0)
        - (proposed.hicbc_result.hicbc_charge if proposed.hicbc_result else 0)
    )
    total_saving = it_saving + hicbc_saved
    net_cost = extra_contribution - total_saving  # what it actually costs after relief
    
    return {
        "scenario_type": "pension_contribution",
        "current": _position_summary(current, current_contributions),
        "proposed": _position_summary(proposed, proposed_contributions),
        "savings": {
            "income_tax": it_saving,
            "national_insurance": 0,  # NI doesn't change
            "hicbc_avoided": hicbc_saved,
            "total_tax_saved": total_saving,
        },
        "contribution_change": {
            "before": current_contributions,
            "after": proposed_contributions,
            "extra": extra_contribution,
        },
        "net_cost": net_cost,
        "effective_relief_rate": (total_saving / extra_contribution * 100) if extra_contribution > 0 else 0,
        "pa_change": {
            "before": current.personal_allowance,
            "after": proposed.personal_allowance,
            "restored": proposed.personal_allowance - current.personal_allowance,
        },
    }
```

---

### 3. Gift Aid Planning — TO BUILD

**What changes**: Gift Aid donations increase. ANI drops (grossed-up donation is deducted). Basic rate band extends.

**Engine calls**:
```python
# Current: no Gift Aid
current = compute_full_tax_position(
    income_sources=[...],
    gift_aid=0,
    ...
)

# Proposed: £10,000 net Gift Aid (= £12,500 gross)
proposed = compute_full_tax_position(
    income_sources=[...],
    gift_aid=10_000,  # Engine grosses up: £10k / 0.8 = £12,500
    ...
)
```

**What the diff shows**:
- Income tax saving (higher rate relief claimed back)
- PA restoration (if grossed-up amount reduces ANI below thresholds)
- HICBC saving (if ANI drops below £80k/£60k)
- The charity gets more (gross-up effect explained)
- Net cost of giving after tax relief

**New function** — `app/tax/gift_aid.py`:

```python
def analyse_gift_aid(
    income_sources: list[IncomeSource],
    current_gift_aid: float,
    proposed_gift_aid: float,
    *,
    pension_contributions: float = 0,
    region: str = "england",
    number_of_children: int = 0,
    claims_child_benefit: bool = False,
) -> dict:
    """Compare tax positions with different Gift Aid levels."""
    
    current = compute_full_tax_position(
        income_sources=income_sources,
        pension_contributions=pension_contributions,
        gift_aid=current_gift_aid,
        region=region,
        number_of_children=number_of_children,
        claims_child_benefit=claims_child_benefit,
    )
    
    proposed = compute_full_tax_position(
        income_sources=income_sources,
        pension_contributions=pension_contributions,
        gift_aid=proposed_gift_aid,
        region=region,
        number_of_children=number_of_children,
        claims_child_benefit=claims_child_benefit,
    )
    
    extra_donated = proposed_gift_aid - current_gift_aid
    gross_up = extra_donated / 0.8  # What the charity actually gets
    it_saving = current.income_tax - proposed.income_tax
    
    return {
        "scenario_type": "gift_aid",
        "current": _position_summary(current),
        "proposed": _position_summary(proposed),
        "donation": {
            "net_donated": extra_donated,
            "gross_to_charity": gross_up,
            "basic_rate_reclaimed_by_charity": gross_up - extra_donated,
        },
        "savings": {
            "income_tax": it_saving,
            "total_tax_saved": it_saving,
        },
        "net_cost_of_giving": extra_donated - it_saving,
        "pa_change": {
            "before": current.personal_allowance,
            "after": proposed.personal_allowance,
            "restored": proposed.personal_allowance - current.personal_allowance,
        },
    }
```

---

### 4. Director Salary/Dividend Split — TO BUILD

**What changes**: Reduces salary, increases dividends. Tax-efficient for company directors who control their remuneration.

This is the most complex scenario because it involves two parties (director and company). The typical strategy: take salary up to the NI Primary Threshold (£12,570), then extract profits as dividends.

**Engine calls**:
```python
# Current: salary £60k, dividends £40k
current = compute_full_tax_position(
    income_sources=[
        IncomeSource(EMPLOYMENT, 60_000),
        IncomeSource(DIVIDENDS, 40_000),
    ],
    region="england",
)

# Proposed: salary £12,570 (NI threshold), dividends £87,430
proposed = compute_full_tax_position(
    income_sources=[
        IncomeSource(EMPLOYMENT, 12_570),  # At NI threshold = zero NI
        IncomeSource(DIVIDENDS, 87_430),   # Taxed at dividend rates
    ],
    region="england",
)
```

**What the diff shows**:
- Income tax change (dividend rates are lower than income tax rates at basic/higher rate)
- Employee NI saving (no NI on dividends)
- Employer NI saving (lower salary = lower employer NI)
- Corporation tax impact (dividends paid from post-CT profits; salary is deductible)
- Total combined saving (personal + company)
- Cash extraction efficiency

**New function** — `app/tax/salary_dividend.py`:

```python
def analyse_salary_dividend_split(
    total_extraction: float,
    current_salary: float,
    current_dividends: float,
    proposed_salary: float,
    proposed_dividends: float,
    *,
    other_income: list[IncomeSource] | None = None,
    corporation_tax_rate: float = 0.25,  # 25% main rate (or 19% small profits)
    region: str = "england",
    number_of_children: int = 0,
    claims_child_benefit: bool = False,
) -> dict:
    """Compare salary/dividend splits for a company director.
    
    Considers both personal tax AND corporation tax impact.
    """
    other = other_income or []
    
    # Personal tax: current
    current_personal = compute_full_tax_position(
        income_sources=[
            IncomeSource(EMPLOYMENT, current_salary),
            IncomeSource(DIVIDENDS, current_dividends),
            *other,
        ],
        region=region,
        number_of_children=number_of_children,
        claims_child_benefit=claims_child_benefit,
    )
    
    # Personal tax: proposed
    proposed_personal = compute_full_tax_position(
        income_sources=[
            IncomeSource(EMPLOYMENT, proposed_salary),
            IncomeSource(DIVIDENDS, proposed_dividends),
            *other,
        ],
        region=region,
        number_of_children=number_of_children,
        claims_child_benefit=claims_child_benefit,
    )
    
    # Corporation tax impact
    # Salary is a deductible expense for CT. Dividends are paid from post-CT profits.
    # So higher salary = lower CT bill, but higher NI.
    current_employer_ni = (
        current_personal.ni_result.class_1.total_employer_ni
        if current_personal.ni_result.class_1 else 0
    )
    proposed_employer_ni = (
        proposed_personal.ni_result.class_1.total_employer_ni
        if proposed_personal.ni_result.class_1 else 0
    )
    
    # CT on the profit used for dividends
    # Company needs to earn enough pre-tax to pay dividends after CT
    current_pre_tax_for_divs = current_dividends / (1 - corporation_tax_rate)
    proposed_pre_tax_for_divs = proposed_dividends / (1 - corporation_tax_rate)
    current_ct = current_pre_tax_for_divs * corporation_tax_rate
    proposed_ct = proposed_pre_tax_for_divs * corporation_tax_rate
    
    return {
        "scenario_type": "salary_dividend_split",
        "current": {
            "salary": current_salary,
            "dividends": current_dividends,
            "personal_tax": current_personal.total_tax,
            "employer_ni": current_employer_ni,
            "corporation_tax": current_ct,
            "total_tax_all": current_personal.total_tax + current_employer_ni + current_ct,
        },
        "proposed": {
            "salary": proposed_salary,
            "dividends": proposed_dividends,
            "personal_tax": proposed_personal.total_tax,
            "employer_ni": proposed_employer_ni,
            "corporation_tax": proposed_ct,
            "total_tax_all": proposed_personal.total_tax + proposed_employer_ni + proposed_ct,
        },
        "savings": {
            "personal_tax": current_personal.total_tax - proposed_personal.total_tax,
            "employer_ni": current_employer_ni - proposed_employer_ni,
            "corporation_tax": current_ct - proposed_ct,  # Will be negative if dividends increase
            "total_combined": (
                (current_personal.total_tax + current_employer_ni + current_ct)
                - (proposed_personal.total_tax + proposed_employer_ni + proposed_ct)
            ),
        },
    }
```

---

### 5. Bed & ISA — TO BUILD (stub exists)

**What changes**: Sell holdings in a General Investment Account, use CGT Annual Exempt Amount, rebuy inside an ISA. Future growth is tax-free.

This doesn't use `compute_full_tax_position` directly — it's a CGT + income tax calculation. But it does need the client's marginal rate to compute the value of the ISA shelter.

**New function** — replace stub in `app/tax/bed_and_isa.py`:

```python
def analyse_bed_and_isa(
    holding_value: float,
    acquisition_cost: float,
    *,
    annual_yield: float = 0,           # Expected dividend/interest yield %
    expected_growth: float = 0,        # Expected capital growth %
    holding_period_years: int = 10,    # How long sheltered
    marginal_income_tax_rate: float = 0.40,
    marginal_cgt_rate: float = 0.20,   # CGT rate (basic/higher)
    remaining_isa_allowance: float = 20_000,
    remaining_cgt_aea: float = 3_000,
) -> dict:
    """Analyse Bed & ISA benefit over a holding period."""
    
    # Step 1: Current gain
    gain = holding_value - acquisition_cost
    
    # Step 2: Amount transferable (limited by ISA allowance)
    transfer_amount = min(holding_value, remaining_isa_allowance)
    transfer_pct = transfer_amount / holding_value if holding_value > 0 else 0
    gain_on_transfer = gain * transfer_pct
    
    # Step 3: CGT on the sell (use AEA)
    taxable_gain = max(0, gain_on_transfer - remaining_cgt_aea)
    cgt_on_sell = taxable_gain * marginal_cgt_rate
    
    # Step 4: Future benefit of ISA shelter
    # Income sheltered each year
    annual_income_sheltered = transfer_amount * (annual_yield / 100)
    annual_income_tax_saved = annual_income_sheltered * marginal_income_tax_rate
    
    # Growth sheltered over period
    future_value_gia = transfer_amount * ((1 + expected_growth / 100) ** holding_period_years)
    future_gain_gia = future_value_gia - transfer_amount
    future_cgt_avoided = future_gain_gia * marginal_cgt_rate
    
    total_tax_saved_over_period = (
        annual_income_tax_saved * holding_period_years
        + future_cgt_avoided
    )
    
    return {
        "scenario_type": "bed_and_isa",
        "current_holding": {
            "value": holding_value,
            "acquisition_cost": acquisition_cost,
            "unrealised_gain": gain,
        },
        "transfer": {
            "amount": transfer_amount,
            "gain_realised": gain_on_transfer,
            "cgt_aea_used": min(gain_on_transfer, remaining_cgt_aea),
            "taxable_gain": taxable_gain,
            "cgt_payable_now": cgt_on_sell,
        },
        "future_benefit": {
            "holding_period_years": holding_period_years,
            "annual_income_sheltered": annual_income_sheltered,
            "annual_income_tax_saved": annual_income_tax_saved,
            "future_growth_sheltered": future_gain_gia,
            "future_cgt_avoided": future_cgt_avoided,
            "total_tax_saved": total_tax_saved_over_period,
        },
        "net_benefit": total_tax_saved_over_period - cgt_on_sell,
        "breakeven_years": (
            cgt_on_sell / annual_income_tax_saved
            if annual_income_tax_saved > 0 else None
        ),
    }
```

---

### 6. Multi-Variable "Optimiser" — FUTURE

Instead of the adviser specifying exact numbers, the engine finds the optimal:

```
"What's the optimal salary sacrifice to minimise Marcus's tax?"
```

This sweeps across a range of sacrifice amounts and finds the best one:

```python
def find_optimal_sacrifice(
    gross_salary: float,
    other_income: list[IncomeSource],
    *,
    min_sacrifice: float = 0,
    max_sacrifice: float | None = None,  # defaults to gross_salary
    step: float = 1_000,
    region: str = "england",
    number_of_children: int = 0,
    claims_child_benefit: bool = False,
) -> dict:
    """Sweep sacrifice amounts and find the optimal point."""
    
    max_sacrifice = max_sacrifice or gross_salary
    best = None
    results = []
    
    for amount in range(int(min_sacrifice), int(max_sacrifice) + 1, int(step)):
        result = analyse_salary_sacrifice(
            gross_salary=gross_salary,
            sacrifice_amount=float(amount),
            other_income_sources=other_income,
            region=region,
            number_of_children=number_of_children,
            claims_child_benefit=claims_child_benefit,
        )
        
        efficiency = result["savings"]["total"] / amount if amount > 0 else 0
        results.append({
            "sacrifice": amount,
            "total_saving": result["savings"]["total"],
            "net_pay": gross_salary - amount - result["proposed"]["total_tax"],
            "efficiency": efficiency,
        })
        
        if best is None or result["savings"]["total"] > best["savings"]["total"]:
            best = result
    
    # Find key thresholds
    thresholds = _find_thresholds(results)
    
    return {
        "optimal": best,
        "sweep": results,
        "thresholds": thresholds,  # e.g., "PA restored at £34,360", "HICBC eliminated at £X"
    }
```

This is a Phase 3 feature — useful for the adviser but not required for the demo.

---

## How a Scenario Flows End-to-End

### Step 1: Adviser Asks

```
"What if Marcus increases his pension sacrifice from £6k to £18k?"
```

### Step 2: Intent Router Classifies

```
Input: "What if Marcus increases his pension sacrifice from £6k to £18k?"
Output: SCENARIO
```

### Step 3: Scenario Modeller Agent Receives

The agent gets:
- The message
- Marcus's client context (income sources, region, children, current sacrifice)
- Marcus's current tax position (from `tax_profiles.cached_summary`)
- Tools: `model_salary_sacrifice`, `compute_tax_position`, `generate_dashboard`

### Step 4: Agent Calls `model_salary_sacrifice` Tool

Claude builds the tool call from the message + client context:

```json
{
  "name": "model_salary_sacrifice",
  "input": {
    "current_gross_salary": 145000,
    "current_sacrifice": 6000,
    "proposed_sacrifice": 18000,
    "other_income": [
      {"source_type": "rental", "gross_amount": 18000},
      {"source_type": "dividends", "gross_amount": 32500}
    ],
    "region": "england",
    "number_of_children": 2,
    "claims_child_benefit": true
  }
}
```

### Step 5: Tool Executor Calls Engine

`services/tools/tax_engine.py` → `execute_model_salary_sacrifice()`:

```python
# Calls analyse_salary_sacrifice() which calls compute_full_tax_position() TWICE
result = analyse_salary_sacrifice(
    gross_salary=145_000,
    sacrifice_amount=18_000,
    current_sacrifice=6_000,
    other_income_sources=[
        IncomeSource(IncomeType.RENTAL, 18_000),
        IncomeSource(IncomeType.DIVIDENDS, 32_500),
    ],
    region="england",
    number_of_children=2,
    claims_child_benefit=True,
)
```

### Step 6: Engine Returns Deterministic Result

```python
{
    "current": {
        "gross_salary": 145000,
        "sacrifice": 6000,
        "income_tax": 51832.00,
        "national_insurance": 5151.60,
        "hicbc": 2212.60,
        "total_tax": 59196.20,
        "personal_allowance": 0,
    },
    "proposed": {
        "gross_salary": 145000,
        "sacrifice": 18000,
        "income_tax": 47032.00,
        "national_insurance": 4911.60,
        "hicbc": 2212.60,
        "total_tax": 54156.20,
        "personal_allowance": 0,
    },
    "savings": {
        "income_tax": 4800.00,
        "national_insurance": 240.00,
        "hicbc_avoided": 0.00,
        "total": 5040.00,
    },
    "pa_change": {
        "current": 0,
        "proposed": 0,
        "restored": 0,
    },
    "extra_into_pension": 12000,
}
```

### Step 7: Agent Calls `generate_dashboard`

Claude passes the scenario result to the dashboard tool:

```json
{
  "name": "generate_dashboard",
  "input": {
    "mode": "iterate",
    "taxData": {
      "scenario": { ...engine result above... }
    }
  }
}
```

### Step 8: Dashboard Scenarios Tab Updates

The frontend receives a `dashboard_update` SSE event and populates the Scenarios tab with the before/after comparison.

### Step 9: Agent Writes Explanation

Using ONLY the engine numbers:

```
Increasing Marcus's salary sacrifice from £6,000 to £18,000 would save £5,040 per year 
in tax:
- Income tax: £4,800 saved (lower taxable employment income)
- Employee NI: £240 saved (2% above UEL on the additional £12k)
- HICBC: No change (ANI still above £80k — full clawback either way)

His take-home pay would reduce by £6,960/yr (£580/month), but £12,000 extra goes 
into his pension pot. For every £1 of take-home sacrificed, £1.72 goes into the pension.

Note: His Personal Allowance remains fully lost in both scenarios — his ANI is still 
well above £125,140. To restore the PA, he'd need to sacrifice approximately £34,360 
total. Want me to model that?
```

---

## The Tool Definitions for the Scenario Agent

These are the Anthropic-format tool schemas that the Scenario Modeller agent has access to.

### `model_salary_sacrifice`

```python
{
    "name": "model_salary_sacrifice",
    "description": (
        "Model the tax impact of changing salary sacrifice amount. "
        "Runs the deterministic engine twice (current vs proposed) and "
        "returns exact savings breakdown. Use for any question about "
        "pension sacrifice, employer contributions, or salary redirection."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "current_gross_salary": {
                "type": "number",
                "description": "Gross salary before any sacrifice"
            },
            "current_sacrifice": {
                "type": "number",
                "default": 0,
                "description": "Current sacrifice amount"
            },
            "proposed_sacrifice": {
                "type": "number",
                "description": "Proposed new sacrifice amount to model"
            },
            "other_income": {
                "type": "array",
                "description": "Non-salary income (rental, dividends, etc.)",
                "items": {
                    "type": "object",
                    "properties": {
                        "source_type": {"type": "string"},
                        "gross_amount": {"type": "number"},
                        "label": {"type": "string"},
                    },
                    "required": ["source_type", "gross_amount"],
                },
            },
            "region": {
                "type": "string",
                "enum": ["england", "wales", "northern_ireland", "scotland"],
                "default": "england",
            },
            "number_of_children": {"type": "integer", "default": 0},
            "claims_child_benefit": {"type": "boolean", "default": False},
        },
        "required": ["current_gross_salary", "proposed_sacrifice"],
    },
}
```

### `model_pension_contribution`

```python
{
    "name": "model_pension_contribution",
    "description": (
        "Model the tax impact of changing personal pension contributions "
        "(SIPP, relief at source). Unlike salary sacrifice, NI doesn't change — "
        "the benefit is income tax relief and ANI reduction."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "income_sources": {
                "type": "array",
                "description": "All income sources (same as compute_tax_position)",
                "items": {
                    "type": "object",
                    "properties": {
                        "source_type": {"type": "string"},
                        "gross_amount": {"type": "number"},
                    },
                    "required": ["source_type", "gross_amount"],
                },
            },
            "current_contributions": {
                "type": "number",
                "default": 0,
                "description": "Current annual personal pension contributions",
            },
            "proposed_contributions": {
                "type": "number",
                "description": "Proposed new contribution level",
            },
            "employer_contributions": {
                "type": "number",
                "default": 0,
                "description": "Employer contributions (unchanged by this scenario)",
            },
            "region": {"type": "string", "default": "england"},
            "number_of_children": {"type": "integer", "default": 0},
            "claims_child_benefit": {"type": "boolean", "default": False},
        },
        "required": ["income_sources", "proposed_contributions"],
    },
}
```

### `model_salary_dividend_split`

```python
{
    "name": "model_salary_dividend_split",
    "description": (
        "Model the combined personal + corporation tax impact of changing "
        "the salary/dividend split for a company director. Considers employer NI, "
        "corporation tax, and personal tax together."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "total_extraction": {
                "type": "number",
                "description": "Total amount to extract from company",
            },
            "current_salary": {"type": "number"},
            "current_dividends": {"type": "number"},
            "proposed_salary": {"type": "number"},
            "proposed_dividends": {"type": "number"},
            "other_income": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "source_type": {"type": "string"},
                        "gross_amount": {"type": "number"},
                    },
                },
            },
            "corporation_tax_rate": {
                "type": "number",
                "default": 0.25,
                "description": "CT rate (0.19 for small profits, 0.25 main rate)",
            },
            "region": {"type": "string", "default": "england"},
            "number_of_children": {"type": "integer", "default": 0},
            "claims_child_benefit": {"type": "boolean", "default": False},
        },
        "required": ["current_salary", "current_dividends", "proposed_salary", "proposed_dividends"],
    },
}
```

### `compute_tax_position`

The Scenario agent also has access to `compute_tax_position` for ad-hoc scenarios that don't fit a pre-built template. It can call it twice manually with different inputs.

---

## Frontend: Scenarios Tab

The dashboard enhancement plan describes the Scenarios tab UI. Here's how it connects to the data.

### Data Shape From the Engine

Every scenario tool returns a standardised comparison structure. The frontend Scenarios tab expects:

```typescript
interface ScenarioResult {
  scenario_type: string;              // "salary_sacrifice" | "pension_contribution" | "salary_dividend_split" | etc.
  
  current: {
    total_tax: number;
    income_tax: number;
    national_insurance: number;
    hicbc: number;
    personal_allowance: number;
    [key: string]: number;            // scenario-specific fields
  };
  
  proposed: {
    total_tax: number;
    income_tax: number;
    national_insurance: number;
    hicbc: number;
    personal_allowance: number;
    [key: string]: number;
  };
  
  savings: {
    income_tax: number;
    national_insurance: number;
    hicbc_avoided: number;
    total: number;
    [key: string]: number;            // e.g., corporation_tax for director scenarios
  };
  
  pa_change: {
    before: number;
    after: number;
    restored: number;
  };
}
```

### Multiple Scenarios in One Session

The adviser might model several options:

```
Turn 1: "What if Marcus sacrifices 18k?"     → Scenario A
Turn 2: "What about 25k?"                    → Scenario B
Turn 3: "And model putting it all the way to restore the PA"  → Scenario C
```

Each scenario is stored in the dashboard data as an entry in a `scenarios` array. The Scenarios tab shows a list on the left and the selected comparison on the right:

```
┌─ Scenarios ─────────────┬─ Comparison ──────────────────────────────────┐
│                         │                                               │
│ A. Sacrifice £18k       │  Current (£6k)       Proposed (£18k)         │
│    Saves £5,040 ✓       │                                               │
│                         │  Income tax  £51,832  £47,032  ✅ -£4,800    │
│ B. Sacrifice £25k       │  NI          £5,152   £4,912   ✅ -£240     │
│    Saves £7,840         │  HICBC       £2,213   £2,213   — no change  │
│                         │  Total       £59,196  £54,156  ✅ -£5,040   │
│ C. Sacrifice £34,360    │                                               │
│    Saves £12,680        │  Take-home:  -£6,960/yr (-£580/mo)           │
│    ★ Best value         │  Into pension: +£12,000/yr                    │
│                         │  Effective relief: 142%                       │
└─────────────────────────┴───────────────────────────────────────────────┘
```

### Dashboard Data Update

When a scenario is modelled, the `generate_dashboard` tool receives:

```json
{
  "mode": "iterate",
  "taxData": {
    "scenarios": [
      {
        "id": "scenario-a",
        "name": "Sacrifice £18k",
        "scenario_type": "salary_sacrifice",
        "current": { ... },
        "proposed": { ... },
        "savings": { "total": 5040 },
        ...
      }
    ]
  }
}
```

The frontend appends this to the existing `dashboardData.scenarios` array. Previous scenarios are preserved — the adviser builds up a comparison set across multiple turns.

---

## Implementation Checklist

| # | Task | File | Status |
|---|------|------|--------|
| 1 | Salary sacrifice analyser | `tax/salary_sacrifice.py` | ✅ Done |
| 2 | Personal pension contribution analyser | `tax/pension_contribution.py` | To build |
| 3 | Gift Aid analyser | `tax/gift_aid.py` | To build |
| 4 | Salary/dividend split analyser | `tax/salary_dividend.py` | To build |
| 5 | Bed & ISA analyser | `tax/bed_and_isa.py` | To build (replace stub) |
| 6 | Tool executor: `model_salary_sacrifice` | `services/tools/tax_engine.py` | To build |
| 7 | Tool executor: `model_pension_contribution` | `services/tools/tax_engine.py` | To build |
| 8 | Tool executor: `model_salary_dividend_split` | `services/tools/tax_engine.py` | To build |
| 9 | Register tools in registry | `services/tools/__init__.py` | To build |
| 10 | Scenario Modeller agent prompt | `services/agents/scenario_modeller.py` | To build |
| 11 | Tool definitions for agent | `services/agents/scenario_modeller.py` | To build |
| 12 | Frontend: Scenarios tab component | `apps/web/.../ScenariosTab.tsx` | To build |
| 13 | Frontend: ScenarioResult type | `packages/shared/src/types/scenarios.ts` | To update |
| 14 | Frontend: scenario list + comparison layout | `apps/web/.../ScenariosTab.tsx` | To build |
| 15 | Optimal sacrifice sweep | `tax/salary_sacrifice.py` | Phase 3 |

### Priority for Demo

**P1 — Must have**:
- Salary sacrifice (already built in engine, just needs tool + agent wiring)
- Personal pension contribution (simple — engine runs twice)
- Scenarios tab on the frontend (before/after layout + savings table)

**P2 — High value**:
- Salary/dividend split (needed for director clients like Olivia Harper)
- Multiple scenario accumulation across turns

**P3 — Later**:
- Gift Aid analyser
- Bed & ISA (replace stub)
- Optimal sacrifice sweep

The salary sacrifice flow is the most impressive demo scenario — it touches income tax, NI, HICBC, PA taper, and pension, all in one "what if" question.

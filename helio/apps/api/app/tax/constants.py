"""UK tax constants for 2025/26.

Authoritative source of truth — TypeScript constants in packages/shared
mirror these values for frontend display purposes.
"""

TAX_YEAR = "2025/26"

# === Income Tax Bands (England, Wales, Northern Ireland) ===

PERSONAL_ALLOWANCE = 12_570
BASIC_RATE_LIMIT = 50_270
HIGHER_RATE_LIMIT = 125_140

INCOME_TAX_BANDS = [
    {"name": "Personal Allowance", "lower": 0, "upper": 12_570, "rate": 0.00},
    {"name": "Basic Rate", "lower": 12_571, "upper": 50_270, "rate": 0.20},
    {"name": "Higher Rate", "lower": 50_271, "upper": 125_140, "rate": 0.40},
    {"name": "Additional Rate", "lower": 125_141, "upper": None, "rate": 0.45},
]

# === Scottish Income Tax Bands ===

SCOTTISH_INCOME_TAX_BANDS = [
    {"name": "Personal Allowance", "lower": 0, "upper": 12_570, "rate": 0.00},
    {"name": "Starter Rate", "lower": 12_571, "upper": 14_876, "rate": 0.19},
    {"name": "Basic Rate", "lower": 14_877, "upper": 26_561, "rate": 0.20},
    {"name": "Intermediate Rate", "lower": 26_562, "upper": 43_662, "rate": 0.21},
    {"name": "Higher Rate", "lower": 43_663, "upper": 75_000, "rate": 0.42},
    {"name": "Advanced Rate", "lower": 75_001, "upper": 125_140, "rate": 0.45},
    {"name": "Top Rate", "lower": 125_141, "upper": None, "rate": 0.48},
]

# === National Insurance ===

# Class 1 — Employees
NI_PRIMARY_THRESHOLD = 12_570
NI_UPPER_EARNINGS_LIMIT = 50_270
NI_EMPLOYEE_MAIN_RATE = 0.08
NI_EMPLOYEE_UPPER_RATE = 0.02
NI_EMPLOYER_SECONDARY_THRESHOLD = 9_100
NI_EMPLOYER_RATE = 0.138

# Class 2 — Self-Employed
NI_CLASS_2_WEEKLY_RATE = 3.45
NI_CLASS_2_PROFIT_THRESHOLD = 12_570

# Class 4 — Self-Employed
NI_CLASS_4_LOWER_PROFIT_LIMIT = 12_570
NI_CLASS_4_UPPER_PROFIT_LIMIT = 50_270
NI_CLASS_4_MAIN_RATE = 0.06
NI_CLASS_4_UPPER_RATE = 0.02

# === Dividend Tax ===

DIVIDEND_ALLOWANCE = 500
DIVIDEND_BASIC_RATE = 0.0875
DIVIDEND_HIGHER_RATE = 0.3375
DIVIDEND_ADDITIONAL_RATE = 0.3935

# === Capital Gains Tax ===

CGT_ANNUAL_EXEMPT_AMOUNT = 3_000
CGT_BASIC_RATE = 0.18
CGT_HIGHER_RATE = 0.24
CGT_RESIDENTIAL_BASIC_RATE = 0.18
CGT_RESIDENTIAL_HIGHER_RATE = 0.24
BADR_RATE = 0.10
BADR_LIFETIME_LIMIT = 1_000_000
INVESTORS_RELIEF_RATE = 0.10
INVESTORS_RELIEF_LIMIT = 10_000_000

# === Allowances ===

ISA_ALLOWANCE = 20_000
LISA_ALLOWANCE = 4_000
JUNIOR_ISA_ALLOWANCE = 9_000
PENSION_ANNUAL_ALLOWANCE = 60_000
PENSION_MIN_TAPERED_AA = 10_000
MONEY_PURCHASE_AA = 10_000
PERSONAL_SAVINGS_ALLOWANCE_BASIC = 1_000
PERSONAL_SAVINGS_ALLOWANCE_HIGHER = 500
PERSONAL_SAVINGS_ALLOWANCE_ADDITIONAL = 0
IHT_ANNUAL_GIFT_EXEMPTION = 3_000
MARRIAGE_ALLOWANCE_TRANSFER = 1_260
TRADING_ALLOWANCE = 1_000
PROPERTY_ALLOWANCE = 1_000
BLIND_PERSONS_ALLOWANCE = 3_070
RENT_A_ROOM_RELIEF = 7_500

# === Key Thresholds ===

PA_TAPER_THRESHOLD = 100_000
PA_TAPER_RATE = 0.5
HICBC_START = 60_000
HICBC_FULL_CLAWBACK = 80_000
PENSION_TAPER_THRESHOLD_INCOME = 200_000
PENSION_TAPER_ADJUSTED_INCOME = 260_000

# === IHT ===

IHT_NIL_RATE_BAND = 325_000
IHT_RESIDENCE_NIL_RATE_BAND = 175_000
IHT_RATE = 0.40
IHT_MAX_TAX_FREE_COUPLE = 1_000_000

# === Pension ===

PENSION_LUMP_SUM_ALLOWANCE = 268_275
PENSION_LUMP_SUM_DEATH_BENEFIT_ALLOWANCE = 1_073_100

PENSION_AA_HISTORY = {
    "2025/26": 60_000,
    "2024/25": 60_000,
    "2023/24": 60_000,
    "2022/23": 40_000,
    "2021/22": 40_000,
}

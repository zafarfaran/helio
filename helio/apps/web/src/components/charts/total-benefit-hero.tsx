"use client";

import { motion } from "framer-motion";

/* ─── Types ─── */

interface TotalBenefitHeroProps {
  totalBenefit: {
    // Personal pension fields
    basic_rate_relief?: number;
    higher_rate_relief?: number;
    // Salary sacrifice fields
    income_tax_saved?: number;
    employee_ni_saved?: number;
    employer_ni_saved?: number;
    take_home_reduction?: number;
    monthly_take_home_drop?: number;
    // Shared fields
    hicbc_avoided?: number;
    pa_restoration_value?: number;
    total_annual_benefit?: number;
    into_pension?: number;
    client_out_of_pocket?: number;
    monthly_benefit?: number;
    monthly_cost?: number;
  };
  netBenefit?: {
    gross_contribution?: number;
    net_cost_to_client?: number;
    basic_rate_relief?: number;
    higher_rate_relief?: number;
    gross_into_pension?: number;
    income_tax_saved?: number;
    ni_saved?: number;
    take_home_reduction?: number;
    hicbc_avoided?: number;
    total_tax_relief?: number;
    total_saving?: number;
    net_cost_after_relief?: number;
    net_benefit?: number;
    effective_cost_per_pound_in_pension?: number;
  };
  isPension: boolean;
  paChange: {
    current: number;
    proposed: number;
    restored: number;
  };
  totalEffectiveReliefRate?: number;
}

/* ─── Helpers ─── */

const fmt = (n: number) =>
  `\u00a3${Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

const ease = [0.16, 1, 0.3, 1] as const;

function reliefBarColor(rate: number): string {
  if (rate < 25) return "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
  if (rate <= 35)
    return "bg-brand-500 shadow-[0_0_10px_rgba(var(--brand-rgb,99,102,241),0.2)]";
  return "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
}

/* ─── Component ─── */

export function TotalBenefitHero({
  totalBenefit,
  netBenefit,
  isPension,
  paChange,
  totalEffectiveReliefRate,
}: TotalBenefitHeroProps) {
  if (!totalBenefit || (totalBenefit.total_annual_benefit ?? 0) <= 0)
    return null;

  if (isPension) {
    return (
      <PensionSummary
        tb={totalBenefit}
        nb={netBenefit}
        paChange={paChange}
        reliefRate={totalEffectiveReliefRate}
      />
    );
  }

  return (
    <SalarySacrificeSummary
      tb={totalBenefit}
      nb={netBenefit}
      paChange={paChange}
    />
  );
}

/* ═══════════════════════════════════════════════════
   Personal Pension Summary
   ═══════════════════════════════════════════════════ */

function PensionSummary({
  tb,
  nb,
  paChange,
  reliefRate: reliefRateProp,
}: {
  tb: TotalBenefitHeroProps["totalBenefit"];
  nb?: TotalBenefitHeroProps["netBenefit"];
  paChange: TotalBenefitHeroProps["paChange"];
  reliefRate?: number;
}) {
  const intoPension = tb.into_pension ?? nb?.gross_contribution ?? 0;
  const clientPays = tb.client_out_of_pocket ?? nb?.net_cost_to_client ?? 0;
  const basicRelief = tb.basic_rate_relief ?? nb?.basic_rate_relief ?? 0;
  const higherRelief = tb.higher_rate_relief ?? nb?.higher_rate_relief ?? 0;
  const hicbcAvoided = tb.hicbc_avoided ?? nb?.hicbc_avoided ?? 0;
  const totalRelief = tb.total_annual_benefit ?? 0;
  const monthlyRelief = tb.monthly_benefit ?? Math.round(totalRelief / 12);
  const netCostAfterRelief =
    nb?.net_cost_after_relief ??
    clientPays - higherRelief - hicbcAvoided;
  const monthlyNetCost =
    tb.monthly_cost ?? Math.round(netCostAfterRelief / 12);
  const costPerPound = nb?.effective_cost_per_pound_in_pension;
  const reliefRate =
    reliefRateProp ??
    (intoPension > 0 ? (totalRelief / intoPension) * 100 : 0);
  const monthlyIntoPension = Math.round(intoPension / 12);

  /* Contribution flow */
  const fundingItems = [
    { label: "You pay", value: clientPays },
    { label: "Gov top-up (20%)", value: basicRelief },
  ].filter((item) => item.value > 0);

  /* Tax relief breakdown */
  const reliefItems = [
    { label: "Gov top-up (20%)", value: basicRelief },
    { label: "Higher-rate relief (via SA)", value: higherRelief },
    { label: "HICBC avoided", value: hicbcAvoided },
  ].filter((item) => item.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
    >
      <div className="rounded-xl border border-slate-200/40 dark:border-zinc-800/30 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-sm p-4">
        {/* ─── Header ─── */}
        <p className="text-[9px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
          Pension Contribution Summary
        </p>

        {/* ─── Hero: Into pension ─── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="flex items-baseline justify-between mb-4"
        >
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {fmt(intoPension)}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-400 dark:text-zinc-500">
              /yr
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-semibold text-slate-700 dark:text-zinc-200">
              into your pension
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-400 dark:text-zinc-500">
              {fmt(monthlyIntoPension)}/mo
            </span>
          </div>
        </motion.div>

        {/* ─── How it's funded ─── */}
        {fundingItems.length > 0 && (
          <div className="mb-3 pb-3 border-b border-slate-200/30 dark:border-zinc-700/20">
            <p className="text-[8px] uppercase tracking-widest text-slate-400 dark:text-zinc-500 font-semibold mb-1.5">
              How it&apos;s funded
            </p>
            <div className="space-y-1">
              {fundingItems.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease, delay: 0.06 + i * 0.04 }}
                  className="flex justify-between items-baseline"
                >
                  <span className="text-[10px] text-slate-600 dark:text-zinc-300">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-mono tabular-nums text-slate-700 dark:text-zinc-200">
                    {fmt(item.value)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Tax relief breakdown ─── */}
        <div className="mb-3 pb-3 border-b border-slate-200/30 dark:border-zinc-700/20">
          <p className="text-[8px] uppercase tracking-widest text-slate-400 dark:text-zinc-500 font-semibold mb-1.5">
            Tax relief you receive
          </p>
          <div className="space-y-1">
            {reliefItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  ease,
                  delay: 0.14 + i * 0.04,
                }}
                className="flex justify-between items-baseline"
              >
                <span className="text-[10px] text-slate-600 dark:text-zinc-300">
                  {item.label}
                </span>
                <span className="text-[10px] font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  +{fmt(item.value)}
                </span>
              </motion.div>
            ))}
            <div className="border-t border-slate-200/30 dark:border-zinc-700/20 mt-1 pt-1" />
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease, delay: 0.26 }}
              className="flex justify-between items-baseline"
            >
              <span className="text-[10px] font-semibold text-slate-700 dark:text-zinc-200">
                Total tax relief
              </span>
              <div className="text-right">
                <span className="text-[13px] font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {fmt(totalRelief)}
                </span>
                <span className="text-[10px] font-mono tabular-nums text-slate-400 dark:text-zinc-500 ml-1">
                  /yr
                </span>
                <span className="block text-[9px] font-mono tabular-nums text-slate-400 dark:text-zinc-500">
                  {fmt(monthlyRelief)}/mo
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ─── Your actual cost ─── */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease, delay: 0.3 }}
          className="flex justify-between items-baseline mb-3"
        >
          <span className="text-[10px] font-semibold text-slate-700 dark:text-zinc-200">
            Your actual cost
          </span>
          <div className="text-right">
            <span className="text-[13px] font-mono font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {fmt(netCostAfterRelief)}
            </span>
            <span className="text-[10px] font-mono tabular-nums text-slate-400 dark:text-zinc-500 ml-1">
              /yr
            </span>
            <span className="block text-[9px] font-mono tabular-nums text-slate-400 dark:text-zinc-500">
              {fmt(monthlyNetCost)}/mo
            </span>
          </div>
        </motion.div>

        {/* ─── Relief rate bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease, delay: 0.34 }}
          className="space-y-1.5"
        >
          <div className="h-[5px] rounded-full bg-emerald-500/[0.06] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(reliefRate, 100)}%` }}
              transition={{ duration: 0.65, ease, delay: 0.38 }}
              className={`h-full rounded-full ${reliefBarColor(reliefRate)}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
              {reliefRate.toFixed(0)}% effective relief
            </p>
            {costPerPound != null && (
              <>
                <span className="text-[10px] text-slate-300 dark:text-zinc-600">
                  &middot;
                </span>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 italic">
                  {costPerPound.toFixed(0)}p per &pound;1 in pension
                </p>
              </>
            )}
          </div>
        </motion.div>

        {/* ─── PA restored pill ─── */}
        {paChange.restored > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.42 }}
            className="mt-2 flex items-center py-1"
          >
            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-800/30 px-2 py-0.5 rounded-full">
              PA restored: +{fmt(paChange.restored)}
              {tb.pa_restoration_value != null &&
                tb.pa_restoration_value > 0 && (
                  <span className="text-emerald-600/70 dark:text-emerald-400/60">
                    (worth {fmt(tb.pa_restoration_value)} in tax)
                  </span>
                )}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   Salary Sacrifice Summary
   ═══════════════════════════════════════════════════ */

function SalarySacrificeSummary({
  tb,
  nb,
  paChange,
}: {
  tb: TotalBenefitHeroProps["totalBenefit"];
  nb?: TotalBenefitHeroProps["netBenefit"];
  paChange: TotalBenefitHeroProps["paChange"];
}) {
  const intoPension = tb.into_pension ?? nb?.gross_into_pension ?? 0;
  const incomeTaxSaved = tb.income_tax_saved ?? nb?.income_tax_saved ?? 0;
  const employeeNiSaved = tb.employee_ni_saved ?? nb?.ni_saved ?? 0;
  const employerNiSaved = tb.employer_ni_saved ?? 0;
  const hicbcAvoided = tb.hicbc_avoided ?? nb?.hicbc_avoided ?? 0;
  const totalSaving = tb.total_annual_benefit ?? 0;
  const monthlySaving = tb.monthly_benefit ?? Math.round(totalSaving / 12);
  const takeHomeReduction =
    tb.take_home_reduction ?? nb?.take_home_reduction ?? 0;
  const monthlyTakeHomeDrop =
    tb.monthly_take_home_drop ?? Math.round(takeHomeReduction / 12);
  const costPerPound = nb?.effective_cost_per_pound_in_pension;
  const monthlyIntoPension = Math.round(intoPension / 12);

  /* Savings breakdown */
  const savingsItems = [
    { label: "Income tax saved", value: incomeTaxSaved },
    { label: "Employee NI saved", value: employeeNiSaved },
    { label: "Employer NI saved", value: employerNiSaved },
    { label: "HICBC avoided", value: hicbcAvoided },
  ].filter((item) => item.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
    >
      <div className="rounded-xl border border-slate-200/40 dark:border-zinc-800/30 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-sm p-4">
        {/* ─── Header ─── */}
        <p className="text-[9px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
          Salary Sacrifice Summary
        </p>

        {/* ─── Hero: Into pension ─── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="flex items-baseline justify-between mb-4 pb-3 border-b border-slate-200/30 dark:border-zinc-700/20"
        >
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              {fmt(intoPension)}
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-400 dark:text-zinc-500">
              /yr
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-semibold text-slate-700 dark:text-zinc-200">
              into your pension
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-400 dark:text-zinc-500">
              {fmt(monthlyIntoPension)}/mo
            </span>
          </div>
        </motion.div>

        {/* ─── Savings breakdown ─── */}
        <div className="mb-3 pb-3 border-b border-slate-200/30 dark:border-zinc-700/20">
          <p className="text-[8px] uppercase tracking-widest text-slate-400 dark:text-zinc-500 font-semibold mb-1.5">
            What you save
          </p>
          <div className="space-y-1">
            {savingsItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  ease,
                  delay: 0.08 + i * 0.04,
                }}
                className="flex justify-between items-baseline"
              >
                <span className="text-[10px] text-slate-600 dark:text-zinc-300">
                  {item.label}
                </span>
                <span className="text-[10px] font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  +{fmt(item.value)}
                </span>
              </motion.div>
            ))}
            <div className="border-t border-slate-200/30 dark:border-zinc-700/20 mt-1 pt-1" />
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease, delay: 0.2 }}
              className="flex justify-between items-baseline"
            >
              <span className="text-[10px] font-semibold text-slate-700 dark:text-zinc-200">
                Total annual saving
              </span>
              <div className="text-right">
                <span className="text-[13px] font-mono font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {fmt(totalSaving)}
                </span>
                <span className="text-[10px] font-mono tabular-nums text-slate-400 dark:text-zinc-500 ml-1">
                  /yr
                </span>
                <span className="block text-[9px] font-mono tabular-nums text-slate-400 dark:text-zinc-500">
                  {fmt(monthlySaving)}/mo
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ─── Take-home impact ─── */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease, delay: 0.26 }}
          className="flex justify-between items-baseline mb-3"
        >
          <span className="text-[10px] font-semibold text-slate-700 dark:text-zinc-200">
            Take-home pay drops by
          </span>
          <div className="text-right">
            <span className="text-[13px] font-mono font-bold tabular-nums text-amber-600 dark:text-amber-400">
              {fmt(takeHomeReduction)}
            </span>
            <span className="text-[10px] font-mono tabular-nums text-slate-400 dark:text-zinc-500 ml-1">
              /yr
            </span>
            <span className="block text-[9px] font-mono tabular-nums text-slate-400 dark:text-zinc-500">
              {fmt(monthlyTakeHomeDrop)}/mo
            </span>
          </div>
        </motion.div>

        {/* ─── Cost per pound ─── */}
        {costPerPound != null && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.3 }}
            className="mb-1"
          >
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 italic">
              {costPerPound.toFixed(0)}p per &pound;1 in pension
            </p>
          </motion.div>
        )}

        {/* ─── PA restored pill ─── */}
        {paChange.restored > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease, delay: 0.34 }}
            className="mt-2 flex items-center py-1"
          >
            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-800/30 px-2 py-0.5 rounded-full">
              PA restored: +{fmt(paChange.restored)}
              {tb.pa_restoration_value != null &&
                tb.pa_restoration_value > 0 && (
                  <span className="text-emerald-600/70 dark:text-emerald-400/60">
                    (worth {fmt(tb.pa_restoration_value)} in tax)
                  </span>
                )}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

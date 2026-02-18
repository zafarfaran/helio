"use client";

import { motion } from "framer-motion";

interface NetIncomeBarProps {
  grossIncome: number;
  totalTax: number;
  nationalInsurance: number;
  netIncome: number;
}

const fmt = (n: number) =>
  `£${n.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

const ease = [0.16, 1, 0.3, 1] as const;

export function NetIncomeBar({ grossIncome, totalTax, nationalInsurance, netIncome }: NetIncomeBarProps) {
  const taxPct = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;
  const niPct = grossIncome > 0 ? (nationalInsurance / grossIncome) * 100 : 0;
  const netPct = grossIncome > 0 ? (netIncome / grossIncome) * 100 : 0;

  return (
    <div className="rounded-xl bg-[var(--card)] border border-[var(--card-border)] p-5">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className="text-[11px] font-medium text-[var(--muted)] uppercase tracking-wide mb-1">Your Take-Home</p>
          <p className="text-[28px] font-semibold font-mono tracking-tight text-emerald-600 dark:text-emerald-400 leading-none">
            {fmt(netIncome)}
          </p>
        </div>
        <p className="text-[12px] font-mono text-[var(--muted)]">
          {netPct.toFixed(1)}% of gross
        </p>
      </div>

      {/* Stacked bar */}
      <div className="h-[10px] rounded-full bg-[var(--surface)] overflow-hidden flex">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${netPct}%` }}
          transition={{ duration: 0.7, ease }}
          className="h-full bg-emerald-500"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${taxPct}%` }}
          transition={{ duration: 0.7, ease, delay: 0.1 }}
          className="h-full bg-red-400"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${niPct}%` }}
          transition={{ duration: 0.7, ease, delay: 0.15 }}
          className="h-full bg-amber-400"
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3">
        {[
          { label: "Take-home", color: "bg-emerald-500", value: fmt(netIncome) },
          { label: "Tax", color: "bg-red-400", value: fmt(totalTax) },
          { label: "NI", color: "bg-amber-400", value: fmt(nationalInsurance) },
        ].map(({ label, color, value }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-[10px] text-[var(--muted)]">{label}</span>
            <span className="text-[10px] font-mono font-medium text-[var(--foreground)]">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

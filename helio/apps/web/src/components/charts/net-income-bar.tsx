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
    <div className="glass-card rounded-2xl p-6 luminous-border relative overflow-hidden">
      {/* Subtle gradient glow behind the take-home number */}
      <div className="absolute top-0 left-0 w-48 h-32 bg-gradient-to-br from-emerald-500/[0.06] to-transparent pointer-events-none rounded-2xl" />

      <div className="relative z-10">
        <div className="flex items-baseline justify-between mb-5">
          <div>
            <p className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-[0.08em] mb-1.5">Your Take-Home</p>
            <p className="text-[32px] font-semibold font-mono tracking-tight text-emerald-500 dark:text-emerald-400 leading-none">
              {fmt(netIncome)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[20px] font-mono font-medium text-[var(--foreground)]/40 leading-none">{netPct.toFixed(1)}%</p>
            <p className="text-[10px] text-[var(--muted)] mt-1">of gross</p>
          </div>
        </div>

        {/* Stacked bar with glow */}
        <div className="h-[8px] rounded-full bg-[var(--glass)] overflow-hidden flex shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${netPct}%` }}
            transition={{ duration: 0.8, ease }}
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${taxPct}%` }}
            transition={{ duration: 0.8, ease, delay: 0.1 }}
            className="h-full bg-gradient-to-r from-red-500 to-red-400"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${niPct}%` }}
            transition={{ duration: 0.8, ease, delay: 0.15 }}
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400"
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-4">
          {[
            { label: "Take-home", color: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]", value: fmt(netIncome) },
            { label: "Tax", color: "bg-red-400", value: fmt(totalTax) },
            { label: "NI", color: "bg-amber-400", value: fmt(nationalInsurance) },
          ].map(({ label, color, value }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-[10px] text-[var(--muted)]">{label}</span>
              <span className="text-[11px] font-mono font-medium text-[var(--foreground)]">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

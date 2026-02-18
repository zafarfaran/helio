"use client";

import { motion } from "framer-motion";

interface Allowance {
  type?: string;
  label?: string;
  name?: string;
  annual_limit?: number;
  annualLimit?: number;
  used: number;
  remaining: number;
  status?: string;
}

interface AllowancesRadialProps {
  allowances: Allowance[];
}

const fmt = (n: number) =>
  `£${n.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

const ease = [0.16, 1, 0.3, 1] as const;

function getName(a: Allowance): string {
  return a.label ?? a.name ?? "Allowance";
}

function getLimit(a: Allowance): number {
  return a.annual_limit ?? a.annualLimit ?? 0;
}

export function AllowancesRadialChart({ allowances }: AllowancesRadialProps) {
  const items = allowances.filter((a) => getLimit(a) > 0);

  if (items.length === 0) return null;

  return (
    <div className="space-y-5">
      {items.map((a, i) => {
        const limit = getLimit(a);
        const pct = limit > 0 ? Math.min((a.used / limit) * 100, 100) : 0;
        const fullyUsed = pct >= 100;
        const nearlyUsed = pct >= 70;

        const barClass = fullyUsed
          ? "bg-amber-500"
          : nearlyUsed
            ? "bg-amber-400"
            : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.15)]";

        return (
          <motion.div
            key={getName(a)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease, delay: i * 0.06 }}
          >
            {/* Label row */}
            <div className="flex items-baseline justify-between mb-1.5">
              <span className="text-[11px] font-medium text-[var(--foreground)]">
                {getName(a)}
              </span>
              <span className="text-[10px] font-mono text-[var(--muted)] tabular-nums">
                {fmt(a.used)}
                <span className="text-[var(--muted)]/25 mx-0.5">/</span>
                {fmt(limit)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-[5px] rounded-full bg-[var(--glass)] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, ease, delay: i * 0.06 + 0.1 }}
                className={`h-full rounded-full ${barClass}`}
              />
            </div>

            {/* Status row */}
            <div className="flex items-center justify-between mt-1">
              <span
                className={`text-[9px] font-medium ${
                  fullyUsed
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-[var(--muted)]/50"
                }`}
              >
                {fullyUsed ? "Fully utilised" : `${fmt(a.remaining)} remaining`}
              </span>
              <span className="text-[9px] font-mono text-[var(--muted)]/35 tabular-nums">
                {pct.toFixed(0)}%
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

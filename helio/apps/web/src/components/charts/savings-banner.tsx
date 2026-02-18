"use client";

import { motion } from "framer-motion";
import { IconLightbulb, IconArrowRight } from "@/components/icons";

interface SavingsBannerProps {
  totalSavings: number;
  opportunityCount: number;
  warningCount: number;
  onViewIntelligence?: () => void;
}

const fmt = (n: number) =>
  `£${n.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

const ease = [0.16, 1, 0.3, 1] as const;

export function SavingsBanner({ totalSavings, opportunityCount, warningCount, onViewIntelligence }: SavingsBannerProps) {
  if (totalSavings <= 0 && opportunityCount === 0 && warningCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease }}
      className="rounded-2xl backdrop-blur-xl border border-emerald-500/[0.12] p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(16, 185, 129, 0.02))',
      }}
    >
      {/* Glow effect */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/[0.1] border border-emerald-500/[0.15] flex items-center justify-center shadow-[0_0_16px_rgba(16,185,129,0.15)]">
            <IconLightbulb className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            {totalSavings > 0 && (
              <p className="text-[18px] font-semibold font-mono text-emerald-600 dark:text-emerald-400 leading-none mb-1">
                {fmt(totalSavings)} in potential savings
              </p>
            )}
            <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/50">
              {opportunityCount > 0 && `${opportunityCount} ${opportunityCount === 1 ? "opportunity" : "opportunities"}`}
              {opportunityCount > 0 && warningCount > 0 && " · "}
              {warningCount > 0 && `${warningCount} ${warningCount === 1 ? "warning" : "warnings"}`}
            </p>
          </div>
        </div>
        {onViewIntelligence && (
          <button
            onClick={onViewIntelligence}
            className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-500 dark:text-emerald-400 hover:text-emerald-400 dark:hover:text-emerald-300 transition-colors px-3 py-1.5 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/[0.1] hover:border-emerald-500/[0.2]"
          >
            View details <IconArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

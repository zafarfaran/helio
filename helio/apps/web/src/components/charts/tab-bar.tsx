"use client";

import { motion } from "framer-motion";

export type TabId = "overview" | "breakdown" | "intelligence" | "notes";

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: "overview", label: "Overview" },
  { id: "breakdown", label: "Breakdown" },
  { id: "intelligence", label: "Intelligence" },
  { id: "notes", label: "Notes" },
];

export function TabBar({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 mb-8 p-1 rounded-2xl bg-[var(--glass)] backdrop-blur-md border border-[var(--glass-border)] w-fit">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative px-4 py-2 text-[12px] font-medium rounded-xl transition-all duration-250 ${
            active === tab.id
              ? "text-[var(--foreground)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]/80"
          }`}
        >
          {active === tab.id && (
            <motion.div
              layoutId="tab-pill"
              className="absolute inset-0 rounded-xl bg-[var(--glass-hover)] border border-[var(--glass-border-hover)] shadow-[0_0_20px_-4px_var(--accent-glow)]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

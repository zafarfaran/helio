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
    <div className="flex items-center gap-1 mb-8 border-b border-[var(--border-subtle)]">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative px-4 py-2.5 text-[12px] font-medium transition-colors ${
            active === tab.id
              ? "text-[var(--foreground)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]/80"
          }`}
        >
          {tab.label}
          {active === tab.id && (
            <motion.div
              layoutId="tab-underline"
              className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-[var(--accent)]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

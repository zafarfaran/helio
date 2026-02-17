"use client";

import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ContextSnippet } from "@/hooks/useContextSnippets";

const ease = [0.16, 1, 0.3, 1] as const;

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const ContextPills = memo(function ContextPills({
  snippets,
  onDismiss,
}: {
  snippets: ContextSnippet[];
  onDismiss: (id: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (snippets.length === 0) return null;

  return (
    <div className="space-y-1.5 mb-2">
      <AnimatePresence mode="popLayout">
        {snippets.map((s) => (
          <motion.div
            key={s.id}
            layout
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.25, ease }}
            className="rounded-xl border border-brand-200/30 dark:border-brand-800/20 bg-brand-50/40 dark:bg-brand-950/20 backdrop-blur-sm overflow-hidden"
          >
            <button
              onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left group"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-md bg-brand-500/10 dark:bg-brand-500/15 flex items-center justify-center">
                <svg className="w-3 h-3 text-brand-500 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-medium text-slate-700 dark:text-zinc-300 truncate block">
                  {s.source_title}
                </span>
                <span className="text-[9px] font-light text-slate-400 dark:text-zinc-600">
                  {s.capture_type === "full_page" ? "Full page" : "Selection"} &middot; {relativeTime(s.created_at)}
                </span>
              </div>
              {/* Dismiss button */}
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(s.id);
                }}
                className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 dark:text-zinc-600 dark:hover:text-zinc-400 hover:bg-slate-200/50 dark:hover:bg-zinc-800/30 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </span>
            </button>

            {/* Expanded preview */}
            <AnimatePresence>
              {expandedId === s.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-2.5 pt-0.5 border-t border-brand-200/20 dark:border-brand-800/10">
                    <p className="text-[10px] font-light text-slate-500 dark:text-zinc-500 leading-relaxed line-clamp-4">
                      {s.markdown_preview}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

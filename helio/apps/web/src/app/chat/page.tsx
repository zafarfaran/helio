"use client";

import { useState, useRef, useEffect, memo, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/theme-provider";
import {
  HelioLogo,
  IconSend,
  IconChevronDown,
  IconUser,
  IconAlertCircle,
  IconTrendingUp,
  IconCheck,
  IconPieChart,
  IconWallet,
  IconLightbulb,
  IconCalculator,
  IconChart,
  IconShield,
  IconArrowRight,
  IconSparkles,
  IconPanelRight,
  IconPanelLeft,
  IconClock,
  IconBookOpen,
  IconPlus,
  IconMic,
  IconStop,
  IconHelioMark,
  IconSearch,
  IconMessage,
  IconTrash,
  IconFileText,
  IconBell,
} from "@/components/icons";

/* ─── Types ─── */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  insights?: Insight[];
}

interface Insight {
  label: string;
  value: string;
  color: "emerald" | "amber" | "red" | "brand";
}

interface Observation {
  severity: "critical" | "warning" | "opportunity" | "info";
  title: string;
  detail: string;
}

/* ─── Sample Data ─── */

const SAMPLE_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "I've loaded Sarah Mitchell's profile for 2025/26. Her current position shows employment income of £145,000, dividend income of £32,500, and rental income of £18,000.\n\nTotal gross income: £195,500\n\nWhat would you like to explore?",
    timestamp: "09:41",
  },
  {
    id: "2",
    role: "user",
    content:
      "What's her current tax liability and are there any obvious planning opportunities?",
    timestamp: "09:42",
  },
  {
    id: "3",
    role: "assistant",
    content:
      "Based on Sarah's current position:\n\nTotal tax liability: £52,847\nEffective tax rate: 27.0%\nMarginal rate: 40%\n\nI've identified 3 key opportunities:\n\n1. Pension contribution headroom — she has £42,000 unused annual allowance, which could save up to £16,800\n\n2. ISA allowance — £20,000 unused this tax year. Moving dividend-generating assets into an ISA wrapper would reduce her dividend tax exposure\n\n3. HICBC exposure — salary sacrifice into pension could eliminate the High Income Child Benefit Charge\n\nShall I model any of these scenarios?",
    timestamp: "09:42",
    insights: [
      { label: "Pension", value: "£16,800", color: "emerald" },
      { label: "ISA", value: "£1,520", color: "brand" },
      { label: "HICBC", value: "£860", color: "amber" },
    ],
  },
];

const SAMPLE_OBSERVATIONS: Observation[] = [
  {
    severity: "critical",
    title: "Personal allowance tapered to £0",
    detail: "Income exceeds £125,140 — full PA taper applies",
  },
  {
    severity: "opportunity",
    title: "£42,000 pension headroom",
    detail: "Potential saving of £16,800 at marginal rate",
  },
  {
    severity: "opportunity",
    title: "Unused ISA allowance",
    detail: "Shelter dividend income to reduce tax exposure",
  },
  {
    severity: "warning",
    title: "HICBC applicable",
    detail: "Salary sacrifice could eliminate the charge",
  },
];

const QUICK_PROMPTS = [
  "Model pension sacrifice",
  "Show dividend tax options",
  "Compare ISA vs GIA",
  "Run salary sacrifice calc",
];

/* ─── Pre-computed waveform data (avoids recalc on render) ─── */

const WAVE_BARS = Array.from({ length: 32 }, (_, i) => ({
  i,
  h: `${14 + ((i * 7 + 3) % 28)}px`,
  dur: `${0.7 + ((i * 13) % 7) * 0.1}s`,
  del: `${i * 0.03}s`,
}));

const AMBIENT_BARS = Array.from({ length: 5 }, (_, i) => ({
  i,
  h: `${8 + i * 2}px`,
  dur: "1.8s",
  del: `${i * 0.15}s`,
}));

/* ─── Chat History ─── */

interface HistoryThread {
  id: string;
  client: { name: string; initials: string; gradient: string };
  title: string;
  preview: string;
  time: string;
  tag?: { label: string; color: string };
  unread?: boolean;
  active?: boolean;
  messageCount: number;
}

const CHAT_HISTORY: { group: string; threads: HistoryThread[] }[] = [
  {
    group: "Today",
    threads: [
      {
        id: "t1",
        client: { name: "Sarah Mitchell", initials: "SM", gradient: "from-brand-400 to-violet-500" },
        title: "Tax planning opportunities",
        preview: "Identified 3 key opportunities including pension headroom...",
        time: "09:42",
        tag: { label: "Planning", color: "brand" },
        active: true,
        messageCount: 3,
      },
      {
        id: "t2",
        client: { name: "David Clarke", initials: "DC", gradient: "from-emerald-400 to-teal-500" },
        title: "Pension consolidation review",
        preview: "Compared 4 pension schemes with total value of £485,000...",
        time: "08:15",
        tag: { label: "Pension", color: "emerald" },
        unread: true,
        messageCount: 7,
      },
    ],
  },
  {
    group: "Yesterday",
    threads: [
      {
        id: "t3",
        client: { name: "Richard Patel", initials: "RP", gradient: "from-amber-400 to-orange-500" },
        title: "IHT estate planning",
        preview: "Estate valued at £2.1M — discussed nil-rate band...",
        time: "16:30",
        tag: { label: "IHT", color: "amber" },
        messageCount: 12,
      },
      {
        id: "t4",
        client: { name: "Margaret Simmons", initials: "MS", gradient: "from-rose-400 to-pink-500" },
        title: "Annual review 2025/26",
        preview: "Reviewed all allowances and updated income projections...",
        time: "11:20",
        messageCount: 9,
      },
    ],
  },
  {
    group: "This Week",
    threads: [
      {
        id: "t5",
        client: { name: "James Wright", initials: "JW", gradient: "from-sky-400 to-blue-500" },
        title: "Salary sacrifice modelling",
        preview: "Modelled £25k salary sacrifice — saves £8,400 in tax...",
        time: "Mon",
        tag: { label: "Sacrifice", color: "brand" },
        messageCount: 5,
      },
      {
        id: "t6",
        client: { name: "Oliver Chen", initials: "OC", gradient: "from-violet-400 to-purple-500" },
        title: "CGT disposal planning",
        preview: "Mapped disposal strategy across 3 tax years to utilise...",
        time: "Mon",
        tag: { label: "CGT", color: "red" },
        messageCount: 8,
      },
    ],
  },
  {
    group: "Earlier",
    threads: [
      {
        id: "t7",
        client: { name: "Emma Davies", initials: "ED", gradient: "from-cyan-400 to-blue-400" },
        title: "Dividend vs salary extraction",
        preview: "Compared extraction strategies for Ltd company director...",
        time: "8 Feb",
        messageCount: 6,
      },
      {
        id: "t8",
        client: { name: "Sarah Mitchell", initials: "SM", gradient: "from-brand-400 to-violet-500" },
        title: "HICBC salary sacrifice",
        preview: "How would salary sacrifice affect her HICBC exposure...",
        time: "5 Feb",
        messageCount: 4,
      },
    ],
  },
];

/* ─── Severity config ─── */

const severityConfig = {
  critical: {
    dot: "bg-red-500",
    bg: "bg-red-500/5 dark:bg-red-500/10",
    border: "border-red-500/20 dark:border-red-500/20",
    text: "text-red-600 dark:text-red-400",
    badge: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  warning: {
    dot: "bg-amber-500",
    bg: "bg-amber-500/5 dark:bg-amber-500/10",
    border: "border-amber-500/20 dark:border-amber-500/20",
    text: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  opportunity: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/5 dark:bg-emerald-500/10",
    border: "border-emerald-500/20 dark:border-emerald-500/20",
    text: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  info: {
    dot: "bg-blue-500",
    bg: "bg-blue-500/5 dark:bg-blue-500/10",
    border: "border-blue-500/20 dark:border-blue-500/20",
    text: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
};

/* ═══════════════════════════════════════════════════
   CHAT PAGE — Refined Command Center
   ═══════════════════════════════════════════════════ */

export default function ChatPage() {
  const [messages] = useState<Message[]>(SAMPLE_MESSAGES);
  const [input, setInput] = useState("");
  const [panelOpen, setPanelOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "allowances" | "observations">("overview");
  const [isListening, setIsListening] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [taxPlanMode, setTaxPlanMode] = useState(false);
  const [clientMenuOpen, setClientMenuOpen] = useState(false);
  const clientMenuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (clientMenuRef.current && !clientMenuRef.current.contains(e.target as Node)) {
        setClientMenuOpen(false);
      }
    }
    if (clientMenuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [clientMenuOpen]);

  /* Memoised history filtering — only recalculates when search changes */
  const filteredHistory = useMemo(() => {
    if (!historySearch) return CHAT_HISTORY;
    const q = historySearch.toLowerCase();
    return CHAT_HISTORY.map((group) => ({
      ...group,
      threads: group.threads.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.client.name.toLowerCase().includes(q) ||
          t.preview.toLowerCase().includes(q)
      ),
    })).filter((g) => g.threads.length > 0);
  }, [historySearch]);

  /* Stable callbacks to avoid child re-renders */
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) e.preventDefault();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[#fafbfc] dark:bg-[#0a0a0c]">
      {/* ═══ Top Bar ═══ */}
      <header className="h-13 border-b border-slate-200/70 dark:border-zinc-800/70 flex items-center justify-between px-4 flex-shrink-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl z-30">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-slate-900 dark:text-white">
            <HelioLogo className="h-7" />
          </Link>

          <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800" />

          {/* History toggle */}
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              historyOpen
                ? "bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400"
                : "text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
            }`}
            title={historyOpen ? "Close history" : "Chat history"}
          >
            <IconPanelLeft className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-zinc-800" />

          {/* Client selector + dropdown */}
          <div className="relative" ref={clientMenuRef}>
            <button
              onClick={() => setClientMenuOpen(!clientMenuOpen)}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 -mx-1 rounded-lg transition-colors group ${
                clientMenuOpen
                  ? "bg-slate-50 dark:bg-zinc-900"
                  : "hover:bg-slate-50 dark:hover:bg-zinc-900"
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-[10px] font-semibold text-white shadow-sm shadow-brand-500/20">
                SM
              </div>
              <div className="text-left">
                <div className="text-[12px] font-medium text-slate-900 dark:text-white leading-tight">Sarah Mitchell</div>
                <div className="text-[10px] font-light text-slate-400 dark:text-zinc-500 leading-tight">2025/26 &middot; Active</div>
              </div>
              <motion.div animate={{ rotate: clientMenuOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <IconChevronDown className="w-3 h-3 text-slate-300 dark:text-zinc-600 group-hover:text-slate-500 dark:group-hover:text-zinc-400 transition-colors" />
              </motion.div>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
              {clientMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-full left-0 mt-1.5 w-64 rounded-xl border border-slate-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xl shadow-slate-200/40 dark:shadow-black/40 z-50 overflow-hidden"
                >
                  {/* Client header */}
                  <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-zinc-800/70">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-[12px] font-semibold text-white shadow-sm shadow-brand-500/20">
                        SM
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-slate-900 dark:text-white">Sarah Mitchell</p>
                        <p className="text-[10px] font-light text-slate-400 dark:text-zinc-500">NI: QQ 12 34 56 C &middot; DOB: 15 Mar 1982</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex-1 text-center px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800/60">
                        <p className="text-[11px] font-mono font-medium text-slate-900 dark:text-white">£195,500</p>
                        <p className="text-[8px] font-light text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Gross</p>
                      </div>
                      <div className="flex-1 text-center px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800/60">
                        <p className="text-[11px] font-mono font-medium text-red-600 dark:text-red-400">£52,847</p>
                        <p className="text-[8px] font-light text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Tax</p>
                      </div>
                      <div className="flex-1 text-center px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800/60">
                        <p className="text-[11px] font-mono font-medium text-slate-900 dark:text-white">27.0%</p>
                        <p className="text-[8px] font-light text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Effective</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5 px-1.5">
                    <ClientMenuItem icon={<IconUser className="w-3.5 h-3.5" />} label="View client profile" />
                    <ClientMenuItem icon={<IconFileText className="w-3.5 h-3.5" />} label="Tax documents" badge="12" />
                    <ClientMenuItem icon={<IconChart className="w-3.5 h-3.5" />} label="Scenario history" badge="3" />
                    <ClientMenuItem icon={<IconClock className="w-3.5 h-3.5" />} label="Meeting notes" />
                    <ClientMenuItem icon={<IconBell className="w-3.5 h-3.5" />} label="Observation alerts" badge="4" accent />
                  </div>

                  {/* Footer actions */}
                  <div className="px-1.5 pb-1.5 pt-0.5 border-t border-slate-100 dark:border-zinc-800/70">
                    <div className="flex gap-1 mt-1.5">
                      <button className="flex-1 text-[10px] font-medium text-brand-500 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20 py-2 rounded-lg transition-colors text-center">
                        Switch client
                      </button>
                      <button className="flex-1 text-[10px] font-medium text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 py-2 rounded-lg transition-colors text-center">
                        Export summary
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Panel toggle */}
          <button
            onClick={() => setPanelOpen(!panelOpen)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              panelOpen
                ? "bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400"
                : "text-slate-400 dark:text-zinc-500 hover:bg-slate-100 dark:hover:bg-zinc-800"
            }`}
            title={panelOpen ? "Close panel" : "Open panel"}
          >
            <IconPanelRight className="w-4 h-4" />
          </button>

          <ThemeToggle />

          <Link href="/settings" className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
            <IconUser className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ═══ Main Split ═══ */}
      <div className="flex-1 flex min-h-0 relative">

        {/* ═══ Chat History Panel ═══ */}
        <AnimatePresence>
          {historyOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex-shrink-0 overflow-hidden border-r border-slate-200/70 dark:border-zinc-800/70 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-sm"
            >
              <div className="w-[300px] h-full flex flex-col">
                {/* History header */}
                <div className="flex-shrink-0 px-4 pt-4 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[13px] font-medium text-slate-900 dark:text-white">History</span>
                    <button className="flex items-center gap-1.5 text-[11px] font-medium text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 px-2 py-1 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-all">
                      <IconPlus className="w-3 h-3" />
                      New chat
                    </button>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 pointer-events-none" />
                    <input
                      type="text"
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search conversations..."
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200/70 dark:border-zinc-800/70 bg-slate-50/50 dark:bg-zinc-900/50 text-[11px] font-light text-slate-900 dark:text-white placeholder:text-slate-400/50 dark:placeholder:text-zinc-600/50 focus:outline-none focus:border-brand-400/50 dark:focus:border-brand-600/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Thread list */}
                <div className="flex-1 overflow-y-auto px-2 pb-3">
                  {filteredHistory.map((group, gi) => (
                    <div key={group.group} className="mb-1">
                      <p className="text-[9px] uppercase tracking-[0.1em] font-medium text-slate-400/60 dark:text-zinc-600/60 px-2 pt-3 pb-1.5">
                        {group.group}
                      </p>
                      <div className="space-y-0.5">
                        {group.threads.map((thread, ti) => (
                          <HistoryItem key={thread.id} thread={thread} delay={gi * 0.05 + ti * 0.03} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ═══ Conversation Area ═══ */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* ── Context ribbon ── */}
          <div className="flex-shrink-0 px-5 py-2.5 border-b border-slate-100 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
            <div className="flex items-center gap-6">
              <ContextChip label="Gross" value="£195,500" />
              <ContextChip label="Tax" value="£52,847" accent="red" />
              <ContextChip label="Effective" value="27.0%" />
              <ContextChip label="Marginal" value="40%" accent="amber" />

              <div className="ml-auto flex items-center gap-4">
                {/* Tax Plan checkbox */}
                <button
                  onClick={() => {
                    const next = !taxPlanMode;
                    setTaxPlanMode(next);
                    if (next) setPanelOpen(true);
                  }}
                  className="flex items-center gap-2 group/tax"
                >
                  <div className={`w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-all duration-200 ${
                    taxPlanMode
                      ? "bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-500/20"
                      : "border-slate-300 dark:border-zinc-600 group-hover/tax:border-emerald-400 dark:group-hover/tax:border-emerald-600"
                  }`}>
                    <AnimatePresence>
                      {taxPlanMode && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <IconCheck className="w-2.5 h-2.5 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <span className={`text-[11px] font-medium transition-colors duration-200 ${
                    taxPlanMode ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-zinc-400 group-hover/tax:text-slate-700 dark:group-hover/tax:text-zinc-300"
                  }`}>
                    Tax Plan
                  </span>
                </button>

                <div className="flex items-center gap-1.5 text-[10px] font-light text-slate-400 dark:text-zinc-600">
                  <IconClock className="w-3 h-3" />
                  Updated just now
                </div>
              </div>
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-5 py-6 space-y-1">
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ChatMessage message={msg} />
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ── Input area ── */}
          <div className="flex-shrink-0 bg-gradient-to-t from-[#fafbfc] via-[#fafbfc] to-transparent dark:from-[#0a0a0c] dark:via-[#0a0a0c] dark:to-transparent">
            <div className="max-w-3xl mx-auto px-5 pb-5 pt-2">
              {/* Quick prompts — only visible when input is empty and not listening */}
              <AnimatePresence>
                {!input.trim() && !isListening && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-3"
                  >
                    {QUICK_PROMPTS.map((prompt, i) => (
                      <motion.button
                        key={prompt}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                        onClick={() => {
                          setInput(prompt);
                          textareaRef.current?.focus();
                        }}
                        className="flex-shrink-0 text-[11px] font-light px-3.5 py-2 rounded-xl border border-slate-200/70 dark:border-zinc-800/70 text-slate-500 dark:text-zinc-400 hover:border-brand-400 dark:hover:border-brand-600 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50/40 dark:hover:bg-brand-950/20 transition-all hover:shadow-sm hover:shadow-brand-500/5"
                      >
                        {prompt}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main input container */}
              <div className={`relative rounded-2xl transition-all duration-300 ${
                inputFocused || isListening
                  ? "shadow-lg shadow-brand-500/8 dark:shadow-brand-500/5"
                  : "shadow-sm shadow-slate-200/50 dark:shadow-none"
              }`}>
                {/* Gradient border */}
                <div className={`absolute -inset-[1px] rounded-2xl transition-opacity duration-300 ${
                  inputFocused || isListening ? "opacity-100" : "opacity-0"
                }`} style={{
                  background: "linear-gradient(135deg, rgba(92,124,250,0.3), rgba(139,92,246,0.2), rgba(92,124,250,0.1))",
                }} />

                {/* Input body */}
                <div className="relative rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/60 overflow-hidden">

                  {/* Voice listening state */}
                  <AnimatePresence>
                    {isListening && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pt-4 pb-2">
                          <div className="flex items-center justify-center gap-1">
                            <div className="listen-pulse flex items-center gap-1 mr-2">
                              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                              <span className="text-[10px] font-medium text-red-500 uppercase tracking-wider">Listening</span>
                            </div>
                          </div>
                          {/* Waveform — pure CSS, GPU-composited */}
                          <div className="flex items-end justify-center gap-[3px] h-12 mt-2">
                            {WAVE_BARS.map((bar) => (
                              <div
                                key={bar.i}
                                className="wave-bar w-[3px] rounded-full bg-gradient-to-t from-brand-500 to-violet-400"
                                style={{ height: bar.h, ["--wave-dur" as string]: bar.dur, ["--wave-del" as string]: bar.del }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Textarea + controls row */}
                  <div className="flex items-end">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={handleTextareaChange}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      placeholder={isListening ? "Speak your question..." : "Ask about Sarah's tax position..."}
                      rows={1}
                      className="flex-1 resize-none bg-transparent pl-5 pr-2 py-4 text-[13px] font-light text-slate-900 dark:text-zinc-100 placeholder:text-slate-400/60 dark:placeholder:text-zinc-600/60 focus:outline-none"
                      style={{ minHeight: "52px", maxHeight: "160px" }}
                      onKeyDown={handleKeyDown}
                    />

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 pr-3 pb-3">
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => setIsListening(!isListening)}
                        className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          isListening
                            ? "bg-red-500 text-white shadow-md shadow-red-500/25"
                            : "bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30"
                        }`}
                      >
                        {isListening ? (
                          <IconStop className="w-3.5 h-3.5" />
                        ) : (
                          <IconMic className="w-4 h-4" />
                        )}
                        {isListening && (
                          <span className="absolute inset-0 rounded-xl border-2 border-red-400 mic-pulse-ring" />
                        )}
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        animate={input.trim() ? { scale: 1 } : { scale: 0.95 }}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 ${
                          input.trim()
                            ? "bg-brand-500 text-white shadow-md shadow-brand-500/25 hover:bg-brand-600 hover:shadow-lg hover:shadow-brand-500/30"
                            : "bg-slate-100 dark:bg-zinc-800 text-slate-300 dark:text-zinc-600"
                        }`}
                      >
                        <IconArrowRight className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>


                  {/* Ambient waveform — pure CSS */}
                  {!input.trim() && !inputFocused && !isListening && (
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-[2px] pointer-events-none">
                      {AMBIENT_BARS.map((bar) => (
                        <div
                          key={bar.i}
                          className="wave-bar-ambient w-[2.5px] rounded-full bg-slate-300/50 dark:bg-zinc-600/40"
                          style={{ height: bar.h, ["--wave-dur" as string]: bar.dur, ["--wave-del" as string]: bar.del }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-2.5 px-1">
                <p className="text-[10px] font-light text-slate-400/50 dark:text-zinc-600/50">
                  Helio may make mistakes. Verify independently.
                </p>
                <kbd className="text-[9px] font-mono text-slate-400/40 dark:text-zinc-600/40 px-1.5 py-0.5 rounded border border-slate-200/30 dark:border-zinc-800/30">
                  &#9166; send
                </kbd>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Intelligence Panel (slide-over) ═══ */}
        <AnimatePresence>
          {panelOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 420, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="flex-shrink-0 overflow-hidden border-l border-slate-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-950"
            >
              <div className="w-[420px] h-full flex flex-col">
                {/* Panel header */}
                <div className="flex-shrink-0 px-5 pt-5 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center">
                        <IconSparkles className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[13px] font-medium text-slate-900 dark:text-white">Intelligence</span>
                    </div>
                    <button className="text-[11px] font-light text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 flex items-center gap-1 transition-colors">
                      Export <IconArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Stat cards — horizontal scroll */}
                  <div className="grid grid-cols-2 gap-2">
                    <MiniStat icon={<IconCalculator className="w-3.5 h-3.5" />} label="Gross income" value="£195,500" />
                    <MiniStat icon={<IconPieChart className="w-3.5 h-3.5" />} label="Tax liability" value="£52,847" accent />
                    <MiniStat icon={<IconChart className="w-3.5 h-3.5" />} label="Effective rate" value="27.0%" />
                    <MiniStat icon={<IconWallet className="w-3.5 h-3.5" />} label="Net income" value="£142,653" />
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex-shrink-0 px-5 pb-3">
                  <div className="flex gap-0.5 bg-slate-100/80 dark:bg-zinc-800/80 rounded-lg p-0.5">
                    {(["overview", "allowances", "observations"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`relative flex-1 px-2 py-1.5 text-[11px] font-medium rounded-md transition-all ${
                          activeTab === tab
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
                        }`}
                      >
                        {activeTab === tab && (
                          <motion.div
                            layoutId="panel-tab"
                            className="absolute inset-0 bg-white dark:bg-zinc-700 rounded-md shadow-sm"
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          />
                        )}
                        <span className="relative z-10 capitalize">{tab}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto px-5 pb-5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                    >
                      {activeTab === "overview" && <TaxBreakdown />}
                      {activeTab === "allowances" && <AllowancesPanel />}
                      {activeTab === "observations" && <ObservationsPanel />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════ */

/* ── Context ribbon chip ── */

const ContextChip = memo(function ContextChip({ label, value, accent }: { label: string; value: string; accent?: "red" | "amber" }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-light text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className={`text-[12px] font-mono font-medium tracking-tight ${
        accent === "red"
          ? "text-red-600 dark:text-red-400"
          : accent === "amber"
            ? "text-amber-600 dark:text-amber-400"
            : "text-slate-900 dark:text-white"
      }`}>{value}</span>
    </div>
  );
});

/* ── Chat message ── */

const ChatMessage = memo(function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end py-3">
        <div className="max-w-[75%]">
          <div className="bg-brand-500 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm shadow-brand-500/10">
            <p className="text-[13px] font-light leading-relaxed whitespace-pre-line">
              {message.content}
            </p>
          </div>
          <p className="text-[10px] font-light text-slate-400 dark:text-zinc-600 text-right mt-1.5 pr-1">
            {message.timestamp}
          </p>
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className="py-3">
      <div className="flex items-start gap-3">
        {/* Avatar — Helio sun mark */}
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-brand-100 to-violet-100 dark:from-brand-900/40 dark:to-violet-900/40 flex items-center justify-center mt-0.5">
          <IconHelioMark className="w-4 h-4 text-brand-600 dark:text-brand-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-medium text-slate-900 dark:text-white">Helio</span>
            <span className="text-[10px] font-light text-slate-400 dark:text-zinc-600">{message.timestamp}</span>
          </div>

          {/* Message body — render lines with formatting */}
          <div className="text-[13px] font-light text-slate-700 dark:text-zinc-300 leading-[1.7]">
            {message.content.split("\n").map((line, i) => {
              if (!line.trim()) return <div key={i} className="h-2" />;

              // Lines starting with a number and dot get styled as list items
              const listMatch = line.match(/^(\d+)\.\s(.+)/);
              if (listMatch) {
                return (
                  <div key={i} className="flex gap-2.5 py-0.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 flex items-center justify-center text-[10px] font-medium mt-0.5">
                      {listMatch[1]}
                    </span>
                    <span className="flex-1">{formatHighlights(listMatch[2])}</span>
                  </div>
                );
              }

              // Lines with key-value pattern (Label: Value)
              const kvMatch = line.match(/^(.+?):\s*(£[\d,.]+|[\d.]+%?)$/);
              if (kvMatch) {
                return (
                  <div key={i} className="flex items-center justify-between py-0.5 border-b border-dashed border-slate-100 dark:border-zinc-800/50 last:border-0">
                    <span className="text-slate-500 dark:text-zinc-400">{kvMatch[1]}</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white text-[12px]">{kvMatch[2]}</span>
                  </div>
                );
              }

              return <p key={i}>{formatHighlights(line)}</p>;
            })}
          </div>

          {/* Insight chips */}
          {message.insights && (
            <div className="flex flex-wrap gap-2 mt-3">
              {message.insights.map((ins, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.3 }}
                  className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-lg text-[11px] font-light border ${
                    ins.color === "emerald"
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400"
                      : ins.color === "amber"
                        ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30 text-amber-700 dark:text-amber-400"
                        : ins.color === "red"
                          ? "bg-red-50 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/30 text-red-700 dark:text-red-400"
                          : "bg-brand-50 dark:bg-brand-950/20 border-brand-200/50 dark:border-brand-800/30 text-brand-700 dark:text-brand-400"
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    ins.color === "emerald" ? "bg-emerald-500" :
                    ins.color === "amber" ? "bg-amber-500" :
                    ins.color === "red" ? "bg-red-500" : "bg-brand-500"
                  }`} />
                  <span>{ins.label}</span>
                  <span className="font-mono font-medium">{ins.value}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

/* ── Format inline highlights ── */

function formatHighlights(text: string) {
  // Highlight pound amounts and percentages
  const parts = text.split(/(£[\d,]+(?:\.\d+)?|\d+(?:\.\d+)?%)/g);
  return parts.map((part, i) => {
    if (/^£/.test(part)) {
      return <span key={i} className="font-mono font-medium text-slate-900 dark:text-white">{part}</span>;
    }
    if (/\d+(?:\.\d+)?%$/.test(part)) {
      return <span key={i} className="font-mono font-medium text-slate-900 dark:text-white">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

/* ── Mini stat (panel) ── */

const MiniStat = memo(function MiniStat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-slate-400 dark:text-zinc-500">{icon}</span>
        <span className="text-[10px] font-light text-slate-400 dark:text-zinc-500">{label}</span>
      </div>
      <div className={`text-lg font-light font-mono tracking-tight ${
        accent ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-white"
      }`}>
        {value}
      </div>
    </div>
  );
});

/* ─── Tax Breakdown ─── */

function TaxBreakdown() {
  const items = [
    { label: "Income Tax", amount: "£42,432", detail: "Basic + Higher rate", pct: 65, color: "bg-brand-500" },
    { label: "National Insurance", amount: "£5,486", detail: "Class 1 primary", pct: 16, color: "bg-violet-500" },
    { label: "Dividend Tax", amount: "£4,069", detail: "Higher rate on £32,000", pct: 12, color: "bg-amber-500" },
    { label: "HICBC", amount: "£860", detail: "Child benefit clawback", pct: 5, color: "bg-red-400" },
  ];

  return (
    <div className="space-y-4">
      {/* Visual bar */}
      <div>
        <div className="flex rounded-lg h-3 overflow-hidden gap-0.5">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ width: 0 }}
              animate={{ width: `${item.pct}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.12 }}
              className={`${item.color} rounded-md`}
              title={item.label}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-sm ${item.color}`} />
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-light">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown rows */}
      <div className="space-y-0.5">
        {items.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.06, duration: 0.4 }}
            className="flex items-center justify-between py-2.5 border-b border-slate-100/80 dark:border-zinc-800/50 last:border-0"
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-1 h-8 rounded-full ${item.color}`} />
              <div>
                <span className="text-[12px] font-normal text-slate-700 dark:text-zinc-200 block">{item.label}</span>
                <span className="text-[10px] font-light text-slate-400 dark:text-zinc-500">{item.detail}</span>
              </div>
            </div>
            <span className="text-[13px] font-mono font-medium text-slate-900 dark:text-white">{item.amount}</span>
          </motion.div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-zinc-700">
        <span className="text-[12px] font-medium text-slate-900 dark:text-white">Total tax liability</span>
        <span className="text-base font-mono font-semibold text-slate-900 dark:text-white">£52,847</span>
      </div>
    </div>
  );
}

/* ─── Allowances ─── */

function AllowancesPanel() {
  const allowances = [
    { label: "Personal Allowance", used: 12570, total: 12570 },
    { label: "Pension Annual Allowance", used: 18000, total: 60000 },
    { label: "ISA Allowance", used: 0, total: 20000 },
    { label: "Dividend Allowance", used: 500, total: 500 },
    { label: "CGT Annual Exemption", used: 0, total: 3000 },
  ];

  return (
    <div className="space-y-4">
      {allowances.map((a, i) => {
        const pct = Math.round((a.used / a.total) * 100);
        const remaining = a.total - a.used;
        const fmt = (n: number) => n >= 1000 ? `£${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `£${n}`;
        const barColor =
          pct >= 100 ? "bg-red-400" :
          pct >= 75 ? "bg-amber-400" :
          pct > 0 ? "bg-brand-400" :
          "bg-slate-200 dark:bg-zinc-700";

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-normal text-slate-700 dark:text-zinc-200">{a.label}</span>
              <span className={`text-[10px] font-mono font-medium ${
                remaining === 0 ? "text-red-500 dark:text-red-400" : "text-slate-500 dark:text-zinc-400"
              }`}>
                {remaining === 0 ? "Fully used" : `${fmt(remaining)} left`}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(pct, pct === 0 ? 0 : 3)}%` }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.08 }}
                className={`h-full rounded-full ${barColor}`}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── Observations ─── */

function ObservationsPanel() {
  return (
    <div className="space-y-2.5">
      {SAMPLE_OBSERVATIONS.map((obs, i) => {
        const config = severityConfig[obs.severity];
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`rounded-lg border ${config.border} ${config.bg} p-3.5`}
          >
            <div className="flex items-start gap-2.5">
              <span className={`flex-shrink-0 w-5 h-5 rounded-full ${config.badge} flex items-center justify-center mt-0.5`}>
                {obs.severity === "opportunity" ? (
                  <IconCheck className="w-2.5 h-2.5" />
                ) : (
                  <IconAlertCircle className="w-2.5 h-2.5" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-slate-800 dark:text-zinc-100">{obs.title}</p>
                <p className="text-[11px] font-light text-slate-500 dark:text-zinc-400 mt-0.5">{obs.detail}</p>
              </div>
              <span className={`flex-shrink-0 text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded ${config.badge}`}>
                {obs.severity}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── History Item ─── */

const tagColors: Record<string, string> = {
  brand: "bg-brand-50 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 border-brand-200/40 dark:border-brand-800/30",
  emerald: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200/40 dark:border-emerald-800/30",
  amber: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200/40 dark:border-amber-800/30",
  red: "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200/40 dark:border-red-800/30",
};

function HistoryItem({ thread, delay }: { thread: HistoryThread; delay: number }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`group relative w-full text-left px-3 py-2.5 rounded-lg transition-all ${
        confirming
          ? "bg-red-50/60 dark:bg-red-950/10 border border-red-200/40 dark:border-red-800/20"
          : thread.active
            ? "bg-brand-50/60 dark:bg-brand-950/20 border border-brand-200/30 dark:border-brand-800/20"
            : "hover:bg-slate-50 dark:hover:bg-zinc-900/60 border border-transparent"
      }`}
    >
      {/* Active indicator bar */}
      {thread.active && !confirming && (
        <motion.div
          layoutId="history-active"
          className="absolute left-0 inset-y-0 my-auto w-[3px] h-5 rounded-r-full bg-brand-500"
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        />
      )}

      {/* Delete confirmation overlay */}
      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 rounded-lg flex items-center justify-center gap-2 z-10 bg-red-50/90 dark:bg-red-950/40 backdrop-blur-[2px]"
          >
            <span className="text-[10px] font-medium text-red-600 dark:text-red-400">Delete?</span>
            <span
              onClick={(e) => { e.stopPropagation(); /* handle delete */ }}
              className="text-[10px] font-medium text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-md transition-colors cursor-pointer shadow-sm shadow-red-500/20"
            >
              Yes
            </span>
            <span
              onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
              className="text-[10px] font-medium text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer"
            >
              No
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2.5">
        {/* Client avatar */}
        <div className={`relative flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${thread.client.gradient} flex items-center justify-center text-[9px] font-semibold text-white shadow-sm mt-0.5`}>
          {thread.client.initials}
          {thread.unread && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-500 border-2 border-white dark:border-zinc-950" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-[11px] font-medium truncate ${
              thread.active
                ? "text-brand-700 dark:text-brand-300"
                : thread.unread
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-700 dark:text-zinc-200"
            }`}>
              {thread.client.name}
            </span>
            <span className="flex-shrink-0 text-[9px] font-light text-slate-400 dark:text-zinc-600">
              {thread.time}
            </span>
          </div>

          <p className={`text-[11px] truncate mt-0.5 ${
            thread.unread
              ? "font-normal text-slate-700 dark:text-zinc-300"
              : "font-light text-slate-500 dark:text-zinc-400"
          }`}>
            {thread.title}
          </p>

          <div className="flex items-center gap-2 mt-1.5">
            {thread.tag && (
              <span className={`text-[8px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border ${tagColors[thread.tag.color] || tagColors.brand}`}>
                {thread.tag.label}
              </span>
            )}
            <span className="flex items-center gap-1 text-[9px] font-light text-slate-400/60 dark:text-zinc-600/60">
              <IconMessage className="w-2.5 h-2.5" />
              {thread.messageCount}
            </span>
          </div>
        </div>
      </div>

      {/* Hover delete button */}
      {!confirming && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span
            onClick={(e) => { e.stopPropagation(); setConfirming(true); }}
            className="w-5 h-5 rounded flex items-center justify-center text-slate-300 dark:text-zinc-600 hover:text-red-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
          >
            <IconTrash className="w-3 h-3" />
          </span>
        </div>
      )}
    </motion.button>
  );
}

/* ─── Client dropdown menu item ─── */

const ClientMenuItem = memo(function ClientMenuItem({ icon, label, badge, accent }: { icon: React.ReactNode; label: string; badge?: string; accent?: boolean }) {
  return (
    <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors group/item">
      <span className="text-slate-400 dark:text-zinc-500 group-hover/item:text-brand-500 dark:group-hover/item:text-brand-400 transition-colors">
        {icon}
      </span>
      <span className="flex-1 text-[11px] font-normal text-slate-700 dark:text-zinc-300">{label}</span>
      {badge && (
        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
          accent
            ? "bg-red-50 dark:bg-red-950/20 text-red-500 dark:text-red-400"
            : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
});

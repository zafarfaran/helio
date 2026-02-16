"use client";

import { useState } from "react";
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
} from "@/components/icons";

/* ─── Types ─── */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
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
      "Hello! I've loaded Sarah Mitchell's tax profile for 2025/26.\n\nHer current position shows employment income of £145,000, dividend income of £32,500, and rental income of £18,000.\n\nTotal gross income: £195,500\n\nWhat would you like to explore?",
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

/* ─── Severity config ─── */

const severityConfig = {
  critical: {
    border: "border-l-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-600 dark:text-red-400",
  },
  warning: {
    border: "border-l-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-600 dark:text-amber-400",
  },
  opportunity: {
    border: "border-l-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  info: {
    border: "border-l-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-600 dark:text-blue-400",
  },
};

/* ═══════════════════════════════════════════════════
   CHAT PAGE
   ═══════════════════════════════════════════════════ */

export default function ChatPage() {
  const [messages] = useState<Message[]>(SAMPLE_MESSAGES);
  const [input, setInput] = useState("");
  const [activeTab, setActiveTab] = useState<"summary" | "allowances" | "observations">("summary");

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-zinc-950">
      {/* ── Top Bar ── */}
      <header className="h-14 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between px-5 flex-shrink-0 bg-white dark:bg-zinc-950">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-slate-900 dark:text-white">
            <HelioLogo className="h-5" />
          </Link>
          <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800" />
          <ClientSelector />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono font-light text-slate-400 dark:text-zinc-500">
            2025/26
          </span>
          <ThemeToggle />
          <button className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
            <IconUser className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Main Split ── */}
      <div className="flex-1 flex min-h-0">
        {/* ── Chat Panel ── */}
        <div className="w-[420px] min-w-[360px] border-r border-slate-100 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-950">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <AnimatePresence>
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ChatMessage message={msg} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your client's tax position..."
                  rows={1}
                  className="w-full resize-none rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-900 px-4 py-3 text-sm font-light text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-brand-400 dark:focus:border-brand-600 focus:ring-1 focus:ring-brand-200 dark:focus:ring-brand-800 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              <button className="w-10 h-10 rounded-lg bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition-colors flex-shrink-0 shadow-sm shadow-brand-500/20">
                <IconSend className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 text-[10px] font-light text-slate-400 dark:text-zinc-600">
              Helio may make mistakes. Always verify tax calculations independently.
            </p>
          </div>
        </div>

        {/* ── Dashboard Panel ── */}
        <div className="flex-1 bg-slate-50/40 dark:bg-zinc-900/30 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-4xl space-y-6">
            {/* Dashboard header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-normal text-slate-900 dark:text-white tracking-tight">
                  Sarah Mitchell
                </h2>
                <p className="text-xs font-light text-slate-400 dark:text-zinc-500 mt-0.5">
                  Tax Year 2025/26 &middot; Last updated just now
                </p>
              </div>
              <button className="inline-flex items-center gap-1.5 text-xs font-light text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
                Export report
                <IconArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Stat row */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-4 gap-4"
            >
              <StatCard icon={<IconCalculator className="w-4 h-4" />} label="Gross income" value="£195,500" />
              <StatCard icon={<IconPieChart className="w-4 h-4" />} label="Tax liability" value="£52,847" delta="+£3,200" negative />
              <StatCard icon={<IconChart className="w-4 h-4" />} label="Effective rate" value="27.0%" delta="+1.2%" negative />
              <StatCard icon={<IconWallet className="w-4 h-4" />} label="Net income" value="£142,653" />
            </motion.div>

            {/* Tab navigation */}
            <div className="flex gap-1 bg-slate-100 dark:bg-zinc-800 rounded-lg p-1">
              {(["summary", "allowances", "observations"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-3 py-2 text-xs font-normal rounded-md transition-all ${
                    activeTab === tab
                      ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {activeTab === "summary" && <TaxBreakdown />}
                {activeTab === "allowances" && <AllowancesPanel />}
                {activeTab === "observations" && <ObservationsPanel />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════ */

function ClientSelector() {
  return (
    <button className="flex items-center gap-2 text-sm hover:bg-slate-50 dark:hover:bg-zinc-900 px-2 py-1 -mx-2 rounded-md transition-colors">
      <div className="w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center text-[10px] font-medium">
        SM
      </div>
      <span className="font-normal text-slate-900 dark:text-white text-[13px]">Sarah Mitchell</span>
      <IconChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
    </button>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] ${
          isUser
            ? "bg-brand-500 text-white rounded-2xl rounded-br-md"
            : "bg-slate-50 dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-700/50 text-slate-700 dark:text-zinc-200 rounded-2xl rounded-bl-md"
        } px-4 py-3`}
      >
        <p className="text-[13px] font-light leading-relaxed whitespace-pre-line">
          {message.content}
        </p>
        <p className={`text-[10px] mt-2 font-light ${isUser ? "text-white/50" : "text-slate-400 dark:text-zinc-500"}`}>
          {message.timestamp}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  delta,
  negative,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: string;
  negative?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-800 p-4 card-hover">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-slate-400 dark:text-zinc-500">{icon}</span>
        <span className="text-[11px] font-light text-slate-500 dark:text-zinc-400">{label}</span>
      </div>
      <div className="text-xl font-light text-slate-900 dark:text-white font-mono tracking-tight">
        {value}
      </div>
      {delta && (
        <div className={`mt-1 text-[11px] font-light flex items-center gap-1 ${negative ? "text-red-500 dark:text-red-400" : "text-emerald-500 dark:text-emerald-400"}`}>
          <IconTrendingUp className="w-3 h-3" />
          {delta} vs last year
        </div>
      )}
    </div>
  );
}

function DashboardCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/60 dark:border-zinc-800 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-slate-400 dark:text-zinc-500">{icon}</span>
        <h3 className="text-sm font-medium text-slate-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ─── Tax Breakdown Tab ─── */

function TaxBreakdown() {
  return (
    <DashboardCard title="Tax Breakdown" icon={<IconPieChart className="w-4 h-4" />}>
      <div className="space-y-3">
        <TaxRow label="Income Tax" amount="£42,432" rate="Basic £2,514 + Higher £39,918" />
        <TaxRow label="National Insurance" amount="£5,486" rate="Class 1 primary" />
        <TaxRow label="Dividend Tax" amount="£4,069" rate="Higher rate on £32,000" />
        <TaxRow label="HICBC" amount="£860" rate="Clawback on child benefit" />
        <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 flex justify-between">
          <span className="text-sm font-medium text-slate-900 dark:text-white">Total</span>
          <span className="text-sm font-medium text-slate-900 dark:text-white font-mono">£52,847</span>
        </div>
      </div>

      {/* Visual breakdown bar */}
      <div className="mt-5 flex rounded-full h-2.5 overflow-hidden gap-0.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "65%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="bg-brand-500 rounded-full"
          title="Income Tax"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "16%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
          className="bg-violet-500 rounded-full"
          title="NICs"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "12%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
          className="bg-amber-500 rounded-full"
          title="Dividend Tax"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "5%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.65 }}
          className="bg-red-400 rounded-full"
          title="HICBC"
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {[
          { color: "bg-brand-500", label: "Income Tax" },
          { color: "bg-violet-500", label: "NICs" },
          { color: "bg-amber-500", label: "Dividends" },
          { color: "bg-red-400", label: "HICBC" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${item.color}`} />
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-light">{item.label}</span>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

function TaxRow({ label, amount, rate }: { label: string; amount: string; rate: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-sm font-light text-slate-700 dark:text-zinc-200">{label}</span>
        <span className="block text-[11px] font-light text-slate-400 dark:text-zinc-500">{rate}</span>
      </div>
      <span className="text-sm font-light text-slate-900 dark:text-white font-mono">{amount}</span>
    </div>
  );
}

/* ─── Allowances Tab ─── */

function AllowancesPanel() {
  return (
    <DashboardCard title="Allowance Utilisation" icon={<IconShield className="w-4 h-4" />}>
      <div className="space-y-5">
        <AllowanceRow label="Personal Allowance" used={12570} total={12570} />
        <AllowanceRow label="Pension Annual Allowance" used={18000} total={60000} />
        <AllowanceRow label="ISA Allowance" used={0} total={20000} />
        <AllowanceRow label="Dividend Allowance" used={500} total={500} />
        <AllowanceRow label="CGT Annual Exemption" used={0} total={3000} />
      </div>
    </DashboardCard>
  );
}

function AllowanceRow({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = Math.round((used / total) * 100);
  const remaining = total - used;
  const barColor =
    pct >= 100 ? "bg-red-400 dark:bg-red-500" :
    pct >= 75 ? "bg-amber-400 dark:bg-amber-500" :
    pct > 0 ? "bg-brand-400 dark:bg-brand-500" :
    "bg-slate-200 dark:bg-zinc-700";

  const fmt = (n: number) => n >= 1000 ? `£${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `£${n}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-light text-slate-700 dark:text-zinc-200">{label}</span>
        <span className="text-xs font-light text-slate-400 dark:text-zinc-500 font-mono">
          {remaining === 0 ? "Fully used" : `${fmt(remaining)} remaining`}
        </span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(pct, 2)}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] font-light text-slate-400 dark:text-zinc-500">{fmt(used)} used</span>
        <span className="text-[10px] font-light text-slate-400 dark:text-zinc-500">{fmt(total)} total</span>
      </div>
    </div>
  );
}

/* ─── Observations Tab ─── */

function ObservationsPanel() {
  return (
    <DashboardCard title="Observations" icon={<IconLightbulb className="w-4 h-4" />}>
      <div className="space-y-3">
        {SAMPLE_OBSERVATIONS.map((obs, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <ObservationCard observation={obs} />
          </motion.div>
        ))}
      </div>
    </DashboardCard>
  );
}

function ObservationCard({ observation }: { observation: Observation }) {
  const config = severityConfig[observation.severity];

  const SeverityIcon = () => {
    switch (observation.severity) {
      case "critical":
      case "warning":
        return <IconAlertCircle className="w-3.5 h-3.5" />;
      case "opportunity":
        return <IconCheck className="w-3.5 h-3.5" />;
      default:
        return <IconAlertCircle className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className={`rounded-lg border-l-[3px] ${config.border} ${config.bg} px-4 py-3`}>
      <div className="flex items-start gap-2.5">
        <span className={`mt-0.5 ${config.text}`}>
          <SeverityIcon />
        </span>
        <div>
          <p className="text-sm font-normal text-slate-800 dark:text-zinc-100">{observation.title}</p>
          <p className="text-xs font-light text-slate-500 dark:text-zinc-400 mt-0.5">{observation.detail}</p>
        </div>
      </div>
    </div>
  );
}

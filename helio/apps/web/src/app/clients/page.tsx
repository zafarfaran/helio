"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/theme-provider";
import { AddClientPanel } from "@/components/add-client-panel";
import { TaxDataForm } from "@/components/tax-data-form";
import {
  HelioLogo,
  IconUser,
  IconSearch,
  IconShield,
  IconTrendingUp,
  IconCalculator,
  IconChart,
  IconWallet,
  IconLightbulb,
  IconAlertCircle,
  IconArrowRight,
  IconZap,
  IconMessage,
  IconFileText,
} from "@/components/icons";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/* ─── Types ─── */

interface ClientSummary {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  region?: string;
  employment_status?: string;
  tax_year?: string;
  total_income?: number;
  total_tax?: number;
  effective_rate?: number;
  marginal_rate?: number;
}

interface TaxBand {
  band: string;
  amount: number;
  rate: number;
  tax: number;
}

interface IncomeSource {
  source_type?: string;
  type?: string;
  label: string;
  gross_amount?: number;
  amount?: number;
}

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

interface HicbcData {
  applies?: boolean;
  number_of_children?: number;
  claims_child_benefit?: boolean;
  child_benefit_amount?: number;
  childBenefitAnnual?: number;
  clawback_percentage?: number;
  clawbackPercentage?: number;
  hicbc_charge?: number;
  charge?: number;
  netBenefit?: number;
}

interface Observation {
  id: string;
  tax_year?: string;
  title: string;
  description: string;
  severity: string;
  priority?: string;
  category?: string;
  potential_saving?: number | null;
  deadline?: string | null;
  action_required?: string | null;
  is_dismissed?: boolean;
  created_at?: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface TaxProfile {
  tax_year: string;
  total_income: number;
  adjusted_net_income?: number;
  taxable_income?: number;
  income_tax: number;
  national_insurance: number;
  dividend_tax: number;
  total_tax: number;
  effective_rate: number;
  marginal_rate: number;
  personal_allowance?: number;
  pa_status?: string;
  in_pa_taper_zone?: boolean;
  hicbc_applies?: boolean;
  pension_taper_applies?: boolean;
  income_sources?: IncomeSource[];
  pension_data?: Record<string, unknown>;
  allowances?: Allowance[];
  hicbc?: HicbcData;
  tax_breakdown?: TaxBand[];
  ni_breakdown?: any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface ClientDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth?: string;
  ni_number?: string;
  utr?: string;
  region?: string;
  employment_status?: string;
  created_at?: string;
  tax_profile?: TaxProfile | null;
  observations?: Observation[];
}

/* ─── Helpers ─── */

const fmt = (n: number | undefined | null): string => {
  if (n == null) return "—";
  return `£${n.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;
};

const fmtFull = (n: number | undefined | null): string => {
  if (n == null) return "—";
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtPct = (n: number | undefined | null): string => {
  if (n == null) return "—";
  return `${n.toFixed(1)}%`;
};

/** Extract a numeric NI value — handles both flat numbers and nested objects
 *  e.g. `4964.16` or `{ total_employee_ni: 4964.16 }` */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractNIValue(v: any): number {
  if (typeof v === "number") return v;
  if (v && typeof v === "object") {
    return v.total_employee_ni ?? v.annual_ni ?? v.total_ni ?? v.total ?? 0;
  }
  return 0;
}

interface NIParsed {
  class1: number;
  class2: number;
  class4: number;
  total: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseNI(raw: any): NIParsed | null {
  if (!raw || typeof raw !== "object") return null;
  const c1 = extractNIValue(raw.class1);
  const c2 = extractNIValue(raw.class2);
  const c4 = extractNIValue(raw.class4);
  return { class1: c1, class2: c2, class4: c4, total: c1 + c2 + c4 };
}

/** Normalise an income source — handles both seed format and dashboard format */
function sourceAmount(s: IncomeSource): number {
  return s.gross_amount ?? s.amount ?? 0;
}

/** Normalise an allowance — DB uses snake_case, dashboard uses camelCase */
function allowanceName(a: Allowance): string {
  return a.label ?? a.name ?? "Allowance";
}
function allowanceLimit(a: Allowance): number {
  return a.annual_limit ?? a.annualLimit ?? 0;
}

/** Normalise HICBC — DB uses snake_case, dashboard uses camelCase */
function hicbcBenefit(h: HicbcData): number {
  return h.child_benefit_amount ?? h.childBenefitAnnual ?? 0;
}
function hicbcClawback(h: HicbcData): number {
  return h.clawback_percentage ?? h.clawbackPercentage ?? 0;
}
function hicbcCharge(h: HicbcData): number {
  return h.hicbc_charge ?? h.charge ?? 0;
}

/* ─── Consistent avatar gradient from name ─── */

const AVATAR_PAIRS: [string, string][] = [
  ["#6366f1", "#818cf8"], // indigo
  ["#0ea5e9", "#38bdf8"], // sky
  ["#8b5cf6", "#a78bfa"], // violet
  ["#ec4899", "#f472b6"], // pink
  ["#14b8a6", "#2dd4bf"], // teal
  ["#f59e0b", "#fbbf24"], // amber
  ["#ef4444", "#f87171"], // red
  ["#10b981", "#34d399"], // emerald
];

function avatarColors(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PAIRS[Math.abs(hash) % AVATAR_PAIRS.length];
}

/* ─── Motion ─── */

const ease = [0.16, 1, 0.3, 1] as const;

const stagger = {
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
};

/* ─── Severity styling ─── */

const SEV: Record<string, { border: string; bg: string; icon: string; badge: string }> = {
  opportunity: { border: "border-l-emerald-500", bg: "bg-emerald-50/60 dark:bg-emerald-500/[0.06]", icon: "text-emerald-500", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" },
  warning:     { border: "border-l-amber-500",   bg: "bg-amber-50/60 dark:bg-amber-500/[0.06]",   icon: "text-amber-500",   badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
  critical:    { border: "border-l-red-500",     bg: "bg-red-50/60 dark:bg-red-500/[0.06]",       icon: "text-red-500",     badge: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400" },
  danger:      { border: "border-l-red-500",     bg: "bg-red-50/60 dark:bg-red-500/[0.06]",       icon: "text-red-500",     badge: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400" },
  info:        { border: "border-l-blue-500",    bg: "bg-blue-50/60 dark:bg-blue-500/[0.06]",     icon: "text-blue-500",    badge: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" },
};

/* ════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════════════════════ */

/* ── Sidebar client row ── */

function ClientRow({ client, active, onSelect }: { client: ClientSummary; active: boolean; onSelect: () => void }) {
  const name = `${client.first_name} ${client.last_name}`;
  const [c1, c2] = avatarColors(name);

  return (
    <button onClick={onSelect} className={`w-full text-left group relative`}>
      {/* Active indicator bar */}
      {active && (
        <motion.div
          layoutId="active-indicator"
          className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-[var(--accent)]"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}

      <div className={`flex items-center gap-3 px-4 py-3 rounded-r-xl ml-1 transition-colors duration-150 ${
        active ? "bg-[var(--accent)]/[0.06]" : "hover:bg-[var(--surface)]"
      }`}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-semibold text-white"
          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
        >
          {client.first_name[0]}{client.last_name[0]}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-medium truncate transition-colors ${active ? "text-[var(--foreground)]" : "text-[var(--foreground)]/80"}`}>
            {name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {client.total_income != null && (
              <span className="text-[10px] font-mono text-[var(--muted)]">{fmt(client.total_income)}</span>
            )}
            {client.effective_rate != null && (
              <>
                <span className="text-[var(--muted)]/30 text-[8px]">&middot;</span>
                <span className="text-[10px] font-mono text-[var(--muted)]">{fmtPct(client.effective_rate)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ── Metric tile ── */

function Metric({ label, value, sub, icon: Icon }: {
  label: string;
  value: string;
  sub?: string;
  icon: React.FC<{ className?: string }>;
}) {
  return (
    <motion.div variants={fadeUp} className="group">
      <div className="rounded-xl bg-[var(--card)] border border-[var(--card-border)] p-5 h-full transition-shadow duration-300 hover:shadow-md hover:shadow-black/[0.03] dark:hover:shadow-black/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-[var(--surface)] flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-[var(--muted)]" />
          </div>
          <span className="text-[11px] font-medium text-[var(--muted)] tracking-wide uppercase">{label}</span>
        </div>
        <p className="text-[22px] font-semibold font-mono tracking-tight text-[var(--foreground)] leading-none">{value}</p>
        {sub && <p className="text-[11px] text-[var(--muted)] mt-2 leading-snug">{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ── Section card ── */

function Card({ title, icon: Icon, children, className }: {
  title: string;
  icon: React.FC<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={fadeUp} className={className}>
      <div className="rounded-xl bg-[var(--card)] border border-[var(--card-border)] overflow-hidden h-full">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[var(--border-subtle)]">
          <Icon className="w-[14px] h-[14px] text-[var(--accent)]" />
          <h3 className="text-[13px] font-semibold text-[var(--foreground)] tracking-[-0.01em]">{title}</h3>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </motion.div>
  );
}

/* ── Key-value row ── */

function KV({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="py-2.5 border-b border-[var(--border-subtle)] last:border-0 flex items-center justify-between gap-4">
      <span className="text-[12px] text-[var(--muted)] flex-shrink-0">{label}</span>
      <span className={`text-[12px] text-[var(--foreground)] text-right truncate ${mono ? "font-mono" : "font-medium"}`}>{value}</span>
    </div>
  );
}

/* ── Tax band row ── */

function BandRow({ band, maxAmt, delay }: { band: TaxBand; maxAmt: number; delay: number }) {
  const pct = maxAmt > 0 ? (band.amount / maxAmt) * 100 : 0;
  const rateStr = `${(band.rate * 100).toFixed(0)}%`;

  const barColor =
    band.rate === 0 ? "bg-slate-200 dark:bg-zinc-700"
    : band.rate <= 0.2 ? "bg-sky-400 dark:bg-sky-500"
    : band.rate <= 0.4 ? "bg-[var(--accent)]"
    : "bg-indigo-500";

  return (
    <div className="py-2.5">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[12px] font-medium text-[var(--foreground)]">{band.band}</span>
        <div className="flex items-baseline gap-5">
          <span className="text-[11px] font-mono text-[var(--muted)] w-8 text-right">{rateStr}</span>
          <span className="text-[12px] font-mono font-medium text-[var(--foreground)] w-[72px] text-right">{fmt(band.tax)}</span>
        </div>
      </div>
      <div className="h-[6px] rounded-full bg-[var(--surface)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease, delay: delay * 0.08 + 0.1 }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
      <p className="text-[10px] font-mono text-[var(--muted)] mt-1">{fmt(band.amount)}</p>
    </div>
  );
}

/* ── Income source bar ── */

function SourceBar({ source, total, delay }: { source: IncomeSource; total: number; delay: number }) {
  const amt = sourceAmount(source);
  const pct = total > 0 ? (amt / total) * 100 : 0;
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] text-[var(--foreground)]">{source.label}</span>
        <span className="text-[12px] font-mono font-medium text-[var(--foreground)]">{fmt(amt)}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-[5px] rounded-full bg-[var(--surface)] overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.55, ease, delay: delay * 0.06 + 0.1 }}
            className="h-full rounded-full bg-[var(--accent)]/60"
          />
        </div>
        <span className="text-[10px] font-mono text-[var(--muted)] w-9 text-right">{pct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

/* ── Allowance bar ── */

function AllowanceBar({ a }: { a: Allowance }) {
  const limit = allowanceLimit(a);
  const pct = limit > 0 ? Math.min((a.used / limit) * 100, 100) : 0;
  const color = a.status === "fully_used" ? "bg-amber-500" : a.remaining > 0 ? "bg-emerald-500" : "bg-[var(--accent)]";

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] text-[var(--foreground)]">{allowanceName(a)}</span>
        <span className="text-[11px] font-mono text-[var(--muted)]">{fmt(a.used)}<span className="text-[var(--muted)]/40"> / </span>{fmt(limit)}</span>
      </div>
      <div className="h-[5px] rounded-full bg-[var(--surface)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.55, ease }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <p className="text-[10px] text-[var(--muted)] mt-0.5">
        {a.remaining > 0 ? `${fmt(a.remaining)} remaining` : "Fully utilised"}
      </p>
    </div>
  );
}

/* ── Observation item ── */

function ObsItem({ obs }: { obs: Observation }) {
  const s = SEV[obs.severity] || SEV.info;

  return (
    <motion.div variants={fadeUp} className={`rounded-lg border-l-[3px] ${s.border} ${s.bg} px-4 py-3.5`}>
      <div className="flex items-start gap-2.5">
        <div className={`mt-0.5 ${s.icon} flex-shrink-0`}>
          {obs.severity === "opportunity" ? <IconLightbulb className="w-3.5 h-3.5" />
            : obs.severity === "warning" ? <IconAlertCircle className="w-3.5 h-3.5" />
            : obs.severity === "critical" || obs.severity === "danger" ? <IconAlertCircle className="w-3.5 h-3.5" />
            : <IconZap className="w-3.5 h-3.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="text-[13px] font-semibold text-[var(--foreground)] leading-tight">{obs.title}</h4>
            <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-[1px] rounded ${s.badge}`}>{obs.severity}</span>
            {obs.potential_saving != null && obs.potential_saving > 0 && (
              <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                Save {fmt(obs.potential_saving)}
              </span>
            )}
          </div>
          <p className="text-[12px] text-[var(--muted)] leading-relaxed">{obs.description}</p>
          {obs.action_required && (
            <div className="flex items-center gap-1 mt-2 text-[11px] font-medium text-[var(--foreground)]/60">
              <IconArrowRight className="w-3 h-3" />
              <span>{obs.action_required}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Loading skeleton ── */

function Skeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-center gap-5">
        <div className="w-[52px] h-[52px] rounded-2xl bg-[var(--surface)]" />
        <div className="space-y-2.5">
          <div className="h-6 w-52 rounded-lg bg-[var(--surface)]" />
          <div className="h-3 w-36 rounded bg-[var(--surface)]" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => <div key={i} className="h-[120px] rounded-xl bg-[var(--surface)]" />)}
      </div>
      <div className="grid grid-cols-2 gap-5">
        {[...Array(2)].map((_, i) => <div key={i} className="h-[200px] rounded-xl bg-[var(--surface)]" />)}
      </div>
      <div className="h-[260px] rounded-xl bg-[var(--surface)]" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════ */

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showTaxForm, setShowTaxForm] = useState(false);

  const handleClientAdded = (newClient: ClientSummary) => {
    setClients((prev) => [newClient, ...prev]);
    setSelectedId(newClient.id);
    setShowAddPanel(false);
  };

  const refetchDetail = useCallback(() => {
    if (!selectedId) return;
    setShowTaxForm(false);
    setDetailLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/clients/${selectedId}`);
        const data: ClientDetail = await res.json();
        setDetail(data);
      } catch { /* noop */ }
      finally { setDetailLoading(false); }
    })();
  }, [selectedId]);

  /* Fetch list */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/clients`);
        const data = await res.json();
        const list: ClientSummary[] = data.clients || [];
        setClients(list);
        if (list.length > 0) setSelectedId(list[0].id);
      } catch { /* noop */ }
      finally { setLoading(false); }
    })();
  }, []);

  /* Fetch detail */
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setShowTaxForm(false);
    setDetailLoading(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/clients/${selectedId}`);
        const data: ClientDetail = await res.json();
        if (!cancelled) setDetail(data);
      } catch { /* noop */ }
      finally { if (!cancelled) setDetailLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [selectedId]);

  /* Keyboard navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const idx = clients.findIndex((c) => c.id === selectedId);
      const next = e.key === "ArrowDown" ? Math.min(idx + 1, clients.length - 1) : Math.max(idx - 1, 0);
      if (clients[next]) setSelectedId(clients[next].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clients, selectedId]);

  /* Search filter */
  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) =>
      `${c.first_name} ${c.last_name} ${c.email}`.toLowerCase().includes(q)
    );
  }, [clients, search]);

  /* Derived */
  const tp = detail?.tax_profile;
  const obs = detail?.observations?.filter((o) => !o.is_dismissed) || [];
  const bands = tp?.tax_breakdown || [];
  const maxBandAmt = Math.max(...bands.map((b) => b.amount), 1);
  const sources = tp?.income_sources || [];
  const allowances = tp?.allowances || [];
  const ni = parseNI(tp?.ni_breakdown);

  const name = detail ? `${detail.first_name} ${detail.last_name}` : "";
  const [c1, c2] = detail ? avatarColors(name) : ["#666", "#888"];

  const dobStr = detail?.date_of_birth
    ? new Date(detail.date_of_birth).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const curIdx = clients.findIndex((c) => c.id === selectedId);

  return (
    <div className="h-screen flex bg-[var(--background)]">

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside className="w-[264px] flex-shrink-0 border-r border-[var(--border)] flex flex-col">

        {/* Brand bar */}
        <div className="h-14 flex items-center justify-between px-5 border-b border-[var(--border-subtle)]">
          <Link href="/" className="text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">
            <HelioLogo className="h-[18px]" />
          </Link>
          <ThemeToggle />
        </div>

        {/* Search + Add */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)] flex-1">Clients</span>
            <button
              onClick={() => setShowAddPanel(true)}
              className="w-6 h-6 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white hover:bg-[var(--accent-hover)] transition-colors"
              title="Add client"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </div>
          <div className="relative">
            <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-[12px] bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--accent)]/30 focus:ring-1 focus:ring-[var(--accent)]/15 transition-all"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto pb-2">
          {loading ? (
            <div className="space-y-1 px-3 animate-pulse">
              {[...Array(6)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-[var(--surface)]" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-[12px] text-[var(--muted)] py-8">No clients found</p>
          ) : (
            filtered.map((c) => (
              <ClientRow key={c.id} client={c} active={c.id === selectedId} onSelect={() => setSelectedId(c.id)} />
            ))
          )}
        </div>

        {/* Sidebar footer */}
        <div className="px-5 py-3 border-t border-[var(--border-subtle)]">
          <Link href="/chat" className="flex items-center gap-2 text-[11px] text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
            <IconMessage className="w-3 h-3" /> Back to chat
          </Link>
        </div>
      </aside>

      {/* ═══════════ MAIN ═══════════ */}
      <main className="flex-1 overflow-y-auto bg-[var(--surface)]/30">
        <div className="max-w-[860px] mx-auto px-10 py-10">
          <AnimatePresence mode="wait">
            {detailLoading || !detail ? (
              <motion.div key="skel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Skeleton />
              </motion.div>
            ) : (
              <motion.div
                key={detail.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease }}
              >

                {/* ── Header ── */}
                <div className="flex items-start justify-between mb-10">
                  <div className="flex items-center gap-5">
                    <div
                      className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-white text-lg font-semibold shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                    >
                      {detail.first_name[0]}{detail.last_name[0]}
                    </div>
                    <div>
                      <h1 className="text-[24px] font-semibold text-[var(--foreground)] tracking-[-0.025em] leading-none">{name}</h1>
                      <div className="flex items-center gap-2 mt-2">
                        {detail.employment_status && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-[3px] rounded-md bg-[var(--accent)]/10 text-[var(--accent)]">
                            {detail.employment_status}
                          </span>
                        )}
                        {detail.region && (
                          <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-[3px] rounded-md bg-[var(--surface)] text-[var(--muted)] border border-[var(--border-subtle)]">
                            {detail.region}
                          </span>
                        )}
                        {tp?.tax_year && (
                          <span className="text-[10px] font-mono text-[var(--muted)]">{tp.tax_year}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Prev / Next + Edit */}
                  <div className="flex items-center gap-3 pt-1">
                    {tp && !showTaxForm && (
                      <button
                        onClick={() => setShowTaxForm(true)}
                        className="text-[11px] font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                      >
                        Edit tax data
                      </button>
                    )}
                    {showTaxForm && (
                      <button
                        onClick={() => setShowTaxForm(false)}
                        className="text-[11px] font-medium text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                      >
                        Cancel edit
                      </button>
                    )}
                    <span className="text-[11px] font-mono text-[var(--muted)]">
                      {curIdx + 1}<span className="text-[var(--muted)]/40"> / </span>{clients.length}
                    </span>
                    <div className="flex gap-1">
                      {[
                        { dir: -1, d: "M15 18l-6-6 6-6", disabled: curIdx <= 0 },
                        { dir: 1, d: "M9 18l6-6-6-6", disabled: curIdx >= clients.length - 1 },
                      ].map(({ dir, d, disabled }) => (
                        <button
                          key={dir}
                          disabled={disabled}
                          onClick={() => {
                            const next = curIdx + dir;
                            if (clients[next]) setSelectedId(clients[next].id);
                          }}
                          className="w-7 h-7 rounded-lg border border-[var(--border)] flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)]/30 transition-colors disabled:opacity-25 disabled:pointer-events-none"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={d} /></svg>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Metrics ── */}
                {tp && !showTaxForm && (
                  <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-4 gap-5 mb-8">
                    <Metric label="Total Income" value={fmt(tp.total_income)} sub={sources.length > 1 ? `${sources.length} income sources` : undefined} icon={IconWallet} />
                    <Metric label="Total Tax" value={fmtFull(tp.total_tax)} sub={`Income tax ${fmt(tp.income_tax)}`} icon={IconCalculator} />
                    <Metric label="Effective Rate" value={fmtPct(tp.effective_rate)} sub="Overall tax burden" icon={IconChart} />
                    <Metric label="Marginal Rate" value={fmtPct(tp.marginal_rate)} sub="Next pound earned" icon={IconTrendingUp} />
                  </motion.div>
                )}

                {/* ── Tax data form for editing existing profile ── */}
                {tp && showTaxForm && (
                  <TaxDataForm
                    clientId={detail.id}
                    clientRegion={detail.region || "england"}
                    onComputed={refetchDetail}
                    existingData={{
                      income_sources: tp.income_sources,
                      pension_data: tp.pension_data as Record<string, unknown> | undefined,
                      hicbc: tp.hicbc as Record<string, unknown> | undefined,
                      allowances: tp.allowances as Array<{ type?: string; used?: number }> | undefined,
                    }}
                  />
                )}

                {/* ── Sections ── */}
                {!showTaxForm && <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-5">

                  {/* Row 1: Personal + Income */}
                  <div className="grid grid-cols-2 gap-5">
                    <Card title="Client Details" icon={IconUser}>
                      <KV label="Email" value={detail.email} />
                      <KV label="NI Number" value={detail.ni_number} mono />
                      <KV label="UTR" value={detail.utr} mono />
                      <KV label="Date of Birth" value={dobStr} />
                      <KV label="Region" value={detail.region} />
                      <KV label="Employment" value={detail.employment_status} />
                    </Card>

                    {sources.length > 0 ? (
                      <Card title="Income Sources" icon={IconWallet}>
                        <div className="space-y-1">
                          {sources.map((s, i) => <SourceBar key={i} source={s} total={tp?.total_income || 0} delay={i} />)}
                        </div>
                        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                          <span className="text-[12px] font-medium text-[var(--foreground)]">Total Gross Income</span>
                          <span className="text-[14px] font-mono font-semibold text-[var(--foreground)]">{fmt(tp?.total_income)}</span>
                        </div>
                      </Card>
                    ) : (
                      <Card title="Income Sources" icon={IconWallet}>
                        <p className="text-[12px] text-[var(--muted)] py-4 text-center">No income sources recorded</p>
                      </Card>
                    )}
                  </div>

                  {/* Tax bands */}
                  {bands.length > 0 && (
                    <Card title="Income Tax by Band" icon={IconCalculator}>
                      <div className="divide-y divide-[var(--border-subtle)]">
                        {bands.map((b, i) => <BandRow key={i} band={b} maxAmt={maxBandAmt} delay={i} />)}
                      </div>
                      <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-[var(--foreground)]">Total Income Tax</span>
                        <span className="text-[16px] font-mono font-bold text-[var(--foreground)]">{fmtFull(tp?.income_tax)}</span>
                      </div>
                    </Card>
                  )}

                  {/* Row 2: NI + Allowances */}
                  {((ni && ni.total > 0) || allowances.length > 0) && (
                  <div className="grid grid-cols-2 gap-5">
                    {ni && ni.total > 0 && (
                      <Card title="National Insurance" icon={IconShield}>
                        <div className="space-y-0">
                          {ni.class1 > 0 && (
                            <div className="py-2.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                              <span className="text-[12px] text-[var(--foreground)]">Class 1 (Employee)</span>
                              <span className="text-[12px] font-mono font-medium text-[var(--foreground)]">{fmtFull(ni.class1)}</span>
                            </div>
                          )}
                          {ni.class2 > 0 && (
                            <div className="py-2.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                              <span className="text-[12px] text-[var(--foreground)]">Class 2 (Self-employed)</span>
                              <span className="text-[12px] font-mono font-medium text-[var(--foreground)]">{fmtFull(ni.class2)}</span>
                            </div>
                          )}
                          {ni.class4 > 0 && (
                            <div className="py-2.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                              <span className="text-[12px] text-[var(--foreground)]">Class 4 (Self-employed)</span>
                              <span className="text-[12px] font-mono font-medium text-[var(--foreground)]">{fmtFull(ni.class4)}</span>
                            </div>
                          )}
                          <div className="pt-3 flex items-center justify-between">
                            <span className="text-[12px] font-semibold text-[var(--foreground)]">Total NI</span>
                            <span className="text-[14px] font-mono font-bold text-[var(--foreground)]">{fmtFull(ni.total)}</span>
                          </div>
                        </div>
                      </Card>
                    )}

                    {allowances.length > 0 && (
                      <Card title="Allowances" icon={IconShield}>
                        <div className="space-y-1">
                          {allowances.map((a, i) => <AllowanceBar key={i} a={a} />)}
                        </div>
                      </Card>
                    )}
                  </div>
                  )}

                  {/* HICBC */}
                  {(tp?.hicbc_applies || tp?.hicbc?.applies) && tp?.hicbc && (
                    <Card title="High Income Child Benefit Charge" icon={IconAlertCircle}>
                      <div className="grid grid-cols-3 gap-5">
                        {[
                          { label: "Child Benefit", value: fmtFull(hicbcBenefit(tp.hicbc)), color: "" },
                          { label: "Clawback", value: `${hicbcClawback(tp.hicbc)}%`, color: "text-amber-600 dark:text-amber-400" },
                          { label: "HICBC Charge", value: fmtFull(hicbcCharge(tp.hicbc)), color: "text-red-600 dark:text-red-400" },
                        ].map(({ label, value, color }) => (
                          <div key={label}>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--muted)] mb-1">{label}</p>
                            <p className={`text-[15px] font-mono font-semibold ${color || "text-[var(--foreground)]"}`}>{value}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Observations */}
                  {obs.length > 0 && (
                    <Card title="Tax Intelligence" icon={IconLightbulb}>
                      <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-3">
                        {obs.map((o) => <ObsItem key={o.id} obs={o} />)}
                      </motion.div>
                    </Card>
                  )}

                </motion.div>}

                {/* Empty state — prompt to enter tax data */}
                {!tp && !showTaxForm && (
                  <div className="rounded-xl border border-dashed border-[var(--border)] p-14 text-center">
                    <IconFileText className="w-7 h-7 mx-auto text-[var(--muted)] mb-3" />
                    <p className="text-[14px] font-medium text-[var(--muted)] mb-1">No tax profile</p>
                    <p className="text-[12px] text-[var(--muted-foreground)] mb-4">Enter income data to calculate this client&apos;s tax position.</p>
                    <button
                      onClick={() => setShowTaxForm(true)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                    >
                      Enter tax data <IconArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Tax data form — shown when no profile exists */}
                {!tp && showTaxForm && (
                  <TaxDataForm
                    clientId={detail.id}
                    clientRegion={detail.region || "england"}
                    onComputed={refetchDetail}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <AddClientPanel
        isOpen={showAddPanel}
        onClose={() => setShowAddPanel(false)}
        onClientAdded={handleClientAdded}
      />
    </div>
  );
}

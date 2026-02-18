"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface WaterfallProps {
  grossIncome: number;
  personalAllowance: number;
  taxableIncome: number;
  incomeTax: number;
  nationalInsurance: number;
  dividendTax?: number;
  netIncome: number;
}

const fmt = (n: number) =>
  `£${Math.abs(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

interface PayloadItem {
  name: string;
  display: number;
  isDeduction: boolean;
  payload: Record<string, unknown>;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: PayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as { name: string; display: number; isDeduction: boolean };
  if (!d) return null;
  return (
    <div className="rounded-lg bg-[var(--card)] border border-[var(--card-border)] shadow-lg px-3 py-2">
      <p className="text-[11px] font-medium text-[var(--foreground)]">{d.name}</p>
      <p className="text-[13px] font-mono font-semibold text-[var(--foreground)]">
        {d.isDeduction ? "−" : ""}{fmt(d.display)}
      </p>
    </div>
  );
}

export function WaterfallChart({
  grossIncome,
  personalAllowance,
  taxableIncome: _taxableIncome,
  incomeTax,
  nationalInsurance,
  dividendTax = 0,
  netIncome,
}: WaterfallProps) {
  const totalDeductions = incomeTax + nationalInsurance + dividendTax;
  const paDeduction = personalAllowance;

  const steps = [
    { name: "Gross", base: 0, value: grossIncome, display: grossIncome, isDeduction: false },
    { name: "PA", base: grossIncome - paDeduction, value: paDeduction, display: paDeduction, isDeduction: true },
    { name: "Income Tax", base: grossIncome - paDeduction - incomeTax, value: incomeTax, display: incomeTax, isDeduction: true },
    ...(nationalInsurance > 0
      ? [{ name: "NI", base: grossIncome - paDeduction - incomeTax - nationalInsurance, value: nationalInsurance, display: nationalInsurance, isDeduction: true }]
      : []),
    ...(dividendTax > 0
      ? [{ name: "Div Tax", base: grossIncome - paDeduction - totalDeductions + dividendTax - dividendTax, value: dividendTax, display: dividendTax, isDeduction: true }]
      : []),
    { name: "Net", base: 0, value: netIncome, display: netIncome, isDeduction: false },
  ];

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={steps} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "var(--muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--muted)" }}
            tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar dataKey="base" stackId="stack" fill="transparent" />
          <Bar dataKey="value" stackId="stack" radius={[4, 4, 0, 0]} animationDuration={800}>
            {steps.map((s, i) => (
              <Cell
                key={i}
                fill={
                  s.name === "Gross" ? "var(--accent)"
                    : s.name === "Net" ? "#10b981"
                    : "#ef4444"
                }
                fillOpacity={s.name === "Gross" || s.name === "Net" ? 1 : 0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

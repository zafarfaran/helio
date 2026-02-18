"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TaxBand {
  band: string;
  amount: number;
  rate: number;
  tax: number;
}

interface TaxBandsChartProps {
  bands: TaxBand[];
}

const fmt = (n: number) =>
  `£${n.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

interface PayloadItem {
  name: string;
  value: number;
  dataKey: string;
  payload: { band: string; rate: string };
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: PayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-[var(--card)] border border-[var(--card-border)] shadow-lg px-3 py-2">
      <p className="text-[11px] font-medium text-[var(--foreground)] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[12px] font-mono text-[var(--foreground)]">
          <span className="text-[var(--muted)]">{p.name}: </span>{fmt(p.value)}
        </p>
      ))}
      {payload[0]?.payload?.rate && (
        <p className="text-[10px] text-[var(--muted)] mt-1">Rate: {payload[0].payload.rate}</p>
      )}
    </div>
  );
}

export function TaxBandsChart({ bands }: TaxBandsChartProps) {
  const data = bands.map((b) => ({
    band: b.band,
    income: b.amount,
    tax: b.tax,
    rate: `${(b.rate * 100).toFixed(0)}%`,
  }));

  if (data.length === 0) return null;

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
          <XAxis
            dataKey="band"
            tick={{ fontSize: 10, fill: "var(--muted)" }}
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface)", opacity: 0.5 }} />
          <Legend
            verticalAlign="top"
            height={30}
            formatter={(value: string) => (
              <span className="text-[11px] text-[var(--muted)]">{value}</span>
            )}
          />
          <Bar dataKey="income" name="Income in Band" fill="var(--accent)" fillOpacity={0.7} radius={[4, 4, 0, 0]} animationDuration={800} />
          <Bar dataKey="tax" name="Tax" fill="#ef4444" fillOpacity={0.75} radius={[4, 4, 0, 0]} animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

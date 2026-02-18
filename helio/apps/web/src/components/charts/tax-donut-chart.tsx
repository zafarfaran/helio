"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface TaxDonutProps {
  incomeTax: number;
  nationalInsurance: number;
  dividendTax: number;
  hicbcCharge?: number;
}

const COLORS = [
  "var(--accent)",
  "#0ea5e9",
  "#8b5cf6",
  "#f59e0b",
];

const fmt = (n: number) =>
  `£${n.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

interface PayloadItem {
  name: string;
  value: number;
  payload: { fill: string };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: PayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-lg bg-[var(--card)] border border-[var(--card-border)] shadow-lg px-3 py-2">
      <p className="text-[11px] font-medium text-[var(--foreground)]">{d.name}</p>
      <p className="text-[13px] font-mono font-semibold text-[var(--foreground)]">{fmt(d.value)}</p>
    </div>
  );
}

export function TaxDonutChart({ incomeTax, nationalInsurance, dividendTax, hicbcCharge }: TaxDonutProps) {
  const data = [
    { name: "Income Tax", value: incomeTax },
    { name: "National Insurance", value: nationalInsurance },
    ...(dividendTax > 0 ? [{ name: "Dividend Tax", value: dividendTax }] : []),
    ...(hicbcCharge && hicbcCharge > 0 ? [{ name: "HICBC", value: hicbcCharge }] : []),
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
            animationBegin={100}
            animationDuration={800}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => (
              <span className="text-[11px] text-[var(--muted)]">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

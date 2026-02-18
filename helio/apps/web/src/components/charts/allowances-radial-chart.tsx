"use client";

import { RadialBarChart, RadialBar, ResponsiveContainer, Tooltip } from "recharts";

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

interface AllowancesRadialProps {
  allowances: Allowance[];
}

const COLORS = ["#10b981", "#0ea5e9", "var(--accent)", "#8b5cf6", "#f59e0b"];

const fmt = (n: number) =>
  `£${n.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

function getName(a: Allowance): string {
  return a.label ?? a.name ?? "Allowance";
}

function getLimit(a: Allowance): number {
  return a.annual_limit ?? a.annualLimit ?? 0;
}

interface PayloadItem {
  name: string;
  value: number;
  payload: { used: number; limit: number; remaining: number };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: PayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as { name: string; used: number; limit: number; remaining: number };
  if (!d) return null;
  return (
    <div className="rounded-lg bg-[var(--card)] border border-[var(--card-border)] shadow-lg px-3 py-2">
      <p className="text-[11px] font-medium text-[var(--foreground)]">{d.name}</p>
      <p className="text-[12px] font-mono text-[var(--foreground)]">Used: {fmt(d.used)} / {fmt(d.limit)}</p>
      <p className="text-[10px] text-[var(--muted)]">{fmt(d.remaining)} remaining</p>
    </div>
  );
}

export function AllowancesRadialChart({ allowances }: AllowancesRadialProps) {
  const data = allowances
    .filter((a) => getLimit(a) > 0)
    .map((a, i) => {
      const limit = getLimit(a);
      return {
        name: getName(a),
        value: limit > 0 ? Math.min((a.used / limit) * 100, 100) : 0,
        used: a.used,
        limit,
        remaining: a.remaining,
        fill: COLORS[i % COLORS.length],
      };
    });

  if (data.length === 0) return null;

  return (
    <div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius={20}
            outerRadius={90}
            barSize={12}
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={6}
              animationDuration={800}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="space-y-1.5 mt-2">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
              <span className="text-[11px] text-[var(--muted)]">{d.name}</span>
            </div>
            <span className="text-[10px] font-mono text-[var(--muted)]">
              {fmt(d.used)}<span className="opacity-40"> / </span>{fmt(d.limit)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

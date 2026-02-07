"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
export function DealbreakerHitRate({
  rates,
}: {
  rates: Record<string, number>;
}) {
  const data = Object.entries(rates)
    .map(([attr, rate]) => ({
      attribute: attr,
      rate: Math.round(rate * 100),
    }))
    .sort((a, b) => b.rate - a.rate);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-muted">
        No dealbreaker data
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Dealbreaker Hit Rates</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
          <YAxis type="category" dataKey="attribute" tick={{ fontSize: 10 }} width={80} />
          <Tooltip formatter={(v) => `${v}%`} />
          <Bar dataKey="rate" fill="var(--color-apple)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

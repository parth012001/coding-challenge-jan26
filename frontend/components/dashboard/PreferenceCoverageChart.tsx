"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export function PreferenceCoverageChart({
  coverage,
}: {
  coverage: Record<string, number>;
}) {
  const data = Object.entries(coverage)
    .map(([attr, pct]) => ({
      attribute: attr,
      coverage: Math.round(pct * 100),
    }))
    .sort((a, b) => b.coverage - a.coverage);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-muted">
        No coverage data
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Preference Coverage</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
          <YAxis type="category" dataKey="attribute" tick={{ fontSize: 10 }} width={80} />
          <Tooltip formatter={(v) => `${v}%`} />
          <Bar dataKey="coverage" fill="var(--color-pear)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

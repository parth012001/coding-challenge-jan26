"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { useOrchardStore } from "@/lib/store";

export function AttributeWeightChart() {
  const history = useOrchardStore((s) => s.conversationHistory);

  const data = useMemo(() => {
    const acc: Record<string, { total: number; count: number }> = {};

    for (const conv of history) {
      for (const match of conv.matches) {
        for (const attr of match.breakdown.our) {
          if (!acc[attr.attribute]) {
            acc[attr.attribute] = { total: 0, count: 0 };
          }
          acc[attr.attribute].total += attr.weight;
          acc[attr.attribute].count += 1;
        }
      }
    }

    return Object.entries(acc)
      .map(([attribute, { total, count }]) => ({
        attribute,
        weight: Math.round((total / count) * 100) / 100,
      }))
      .sort((a, b) => b.weight - a.weight);
  }, [history]);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-muted">
        No weight data yet
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Attribute Weights (Avg)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} layout="vertical">
          <XAxis type="number" tick={{ fontSize: 10 }} />
          <YAxis
            type="category"
            dataKey="attribute"
            width={90}
            tick={{ fontSize: 10 }}
          />
          <Tooltip
            formatter={(value) => [`${value}x`, "Avg Weight"]}
          />
          <Bar
            dataKey="weight"
            fill="var(--color-primary)"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

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

const BUCKETS = [
  { range: "0-20", min: 0, max: 20 },
  { range: "21-40", min: 21, max: 40 },
  { range: "41-60", min: 41, max: 60 },
  { range: "61-80", min: 61, max: 80 },
  { range: "81-100", min: 81, max: 100 },
];

export function MatchQualityHistogram() {
  const history = useOrchardStore((s) => s.conversationHistory);

  const scores = useMemo(
    () => history.flatMap((c) => c.matches.map((m) => m.score)),
    [history]
  );

  const data = BUCKETS.map((bucket) => ({
    range: bucket.range,
    count: scores.filter((s) => s >= bucket.min && s <= bucket.max).length,
  }));

  if (scores.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-muted">
        No match data yet
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Match Quality Distribution</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data}>
          <XAxis dataKey="range" tick={{ fontSize: 10 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="count" fill="var(--color-pear)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

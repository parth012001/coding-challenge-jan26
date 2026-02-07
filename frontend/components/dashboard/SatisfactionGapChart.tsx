"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useOrchardStore } from "@/lib/store";

export function SatisfactionGapChart() {
  const history = useOrchardStore((s) => s.conversationHistory);

  const byType = { apple: { our: 0, their: 0, count: 0 }, orange: { our: 0, their: 0, count: 0 } };

  history.forEach((conv) => {
    conv.matches.forEach((m) => {
      byType[conv.fruitType].our += m.ourScore;
      byType[conv.fruitType].their += m.theirScore;
      byType[conv.fruitType].count++;
    });
  });

  const data = (["apple", "orange"] as const).map((type) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    "Your Score": byType[type].count
      ? Math.round(byType[type].our / byType[type].count)
      : 0,
    "Their Score": byType[type].count
      ? Math.round(byType[type].their / byType[type].count)
      : 0,
  }));

  if (history.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-muted">
        No match data yet
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Satisfaction Gap</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data}>
          <XAxis dataKey="type" tick={{ fontSize: 10 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Bar dataKey="Your Score" fill="var(--color-apple)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Their Score" fill="var(--color-orange)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

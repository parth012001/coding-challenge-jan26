"use client";

import { useMemo } from "react";
import { useOrchardStore } from "@/lib/store";
import { MetricCard } from "./MetricCard";

export function DashboardOverview() {
  const history = useOrchardStore((s) => s.conversationHistory);

  const metrics = useMemo(() => {
    const allMatches = history.flatMap((c) => c.matches);

    if (allMatches.length === 0) {
      return {
        avgScore: "---",
        avgScoreDesc: "Run matches to see",
        satGap: "---",
        satGapDesc: "Run matches to see",
        topMatchRate: "---",
        topMatchRateDesc: "Run matches to see",
        matchesMade: "---",
        matchesMadeDesc: "Run matches to see",
      };
    }

    const avgScore = Math.round(
      allMatches.reduce((sum, m) => sum + m.score, 0) / allMatches.length
    );

    const avgGap = Math.round(
      allMatches.reduce(
        (sum, m) => sum + Math.abs(m.ourScore - m.theirScore),
        0
      ) / allMatches.length
    );

    const topMatches = history.filter(
      (c) => c.matches.length > 0 && c.matches[0].score >= 70
    );
    const topMatchRate =
      history.length > 0
        ? Math.round((topMatches.length / history.length) * 100)
        : 0;

    return {
      avgScore: `${avgScore}%`,
      avgScoreDesc: "Across all matches",
      satGap: `${avgGap}%`,
      satGapDesc: "Lower is better",
      topMatchRate: `${topMatchRate}%`,
      topMatchRateDesc: "#1 match scores 70+",
      matchesMade: history.length,
      matchesMadeDesc: "Conversations completed",
    };
  }, [history]);

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <MetricCard
        title="Avg Match Score"
        value={metrics.avgScore}
        icon="🎯"
        description={metrics.avgScoreDesc}
        accentColor="var(--color-pear)"
        compact
      />
      <MetricCard
        title="Satisfaction Gap"
        value={metrics.satGap}
        icon="⚖️"
        description={metrics.satGapDesc}
        accentColor="var(--color-primary)"
        compact
      />
      <MetricCard
        title="Top Match Rate"
        value={metrics.topMatchRate}
        icon="🏆"
        description={metrics.topMatchRateDesc}
        accentColor="var(--color-pear)"
        compact
      />
      <MetricCard
        title="Matches Made"
        value={metrics.matchesMade}
        icon="🤝"
        description={metrics.matchesMadeDesc}
        accentColor="var(--color-orange)"
        compact
      />
    </div>
  );
}

"use client";

import { useOrchardStore } from "@/lib/store";
import { formatRelativeTime } from "@/lib/utils";
import { FruitIcon } from "@/components/shared/FruitIcon";

export function RecentMatchesFeed() {
  const history = useOrchardStore((s) => s.conversationHistory);

  if (history.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-xs text-muted">
        No conversations yet
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">Recent Matches</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {history.slice(0, 10).map((conv) => {
          const topMatch = conv.matches[0] ?? null;
          const topScore = topMatch?.score ?? 0;
          const gap = topMatch
            ? Math.abs(topMatch.ourScore - topMatch.theirScore)
            : 0;
          return (
            <div
              key={conv.id}
              className="flex items-center gap-3 rounded-lg border border-border p-2.5 text-xs"
            >
              <FruitIcon type={conv.fruitType} size={18} />
              <div className="flex-1 min-w-0">
                <span className="font-medium">
                  {conv.fruitType === "apple" ? "Apple" : "Orange"}
                </span>
                <span className="text-muted"> matched</span>
              </div>
              <span
                className={`font-bold ${
                  topScore >= 70
                    ? "text-pear"
                    : topScore >= 40
                      ? "text-orange"
                      : "text-apple"
                }`}
              >
                {topScore}%
              </span>
              {topMatch && (
                <span
                  className={`whitespace-nowrap ${
                    gap <= 10
                      ? "text-pear"
                      : gap <= 25
                        ? "text-orange"
                        : "text-apple"
                  }`}
                  style={{ fontSize: "var(--text-caption)" }}
                >
                  gap:{gap}%
                </span>
              )}
              <span className="text-muted whitespace-nowrap">
                {formatRelativeTime(conv.createdAt)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { FruitAvatar } from "../act1/FruitAvatar";
import type { FruitType, MatchResult, MatchExplanation } from "@/lib/types";

interface MatchCardFrontProps {
  match: MatchResult;
  rank: number;
  fruitType: FruitType;
  explanation?: MatchExplanation;
}

export function MatchCardFront({
  match,
  rank,
  fruitType,
  explanation,
}: MatchCardFrontProps) {
  const oppositeType: FruitType = fruitType === "apple" ? "orange" : "apple";
  const scoreColor =
    match.score < 40
      ? "text-apple"
      : match.score < 70
        ? "text-orange"
        : "text-pear";

  return (
    <div className="match-card__face flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pear/20 text-xs font-bold text-pear">
          #{rank}
        </span>
        <FruitAvatar
          fruitType={oppositeType}
          attributes={match.attributes}
          size="sm"
          animate={false}
        />
      </div>

      <div className={`text-3xl font-mono font-bold ${scoreColor}`}>
        {match.score}%
      </div>

      <p className="text-sm text-muted leading-relaxed">
        {explanation?.overallSummary ?? `Match score: ${match.score}%`}
      </p>

      <p className="mt-auto text-muted" style={{ fontSize: "var(--text-caption)" }}>Click to flip</p>
    </div>
  );
}

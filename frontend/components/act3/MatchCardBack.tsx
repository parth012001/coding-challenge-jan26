"use client";

import type { MatchResult, MatchExplanation } from "@/lib/types";

interface MatchCardBackProps {
  match: MatchResult;
  explanation?: MatchExplanation;
  onInspect?: () => void;
}

export function MatchCardBack({ match, explanation, onInspect }: MatchCardBackProps) {
  return (
    <div className="match-card__face match-card__back flex flex-col gap-3 overflow-y-auto">
      <div className="space-y-3">
        <div>
          <h4 className="font-semibold text-apple mb-1" style={{ fontSize: "var(--text-detail)" }}>
            Why they like you ({match.theirScore}%)
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            {explanation?.whyTheyLikeYou ??
              `They scored you ${match.theirScore}% compatibility.`}
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-orange mb-1" style={{ fontSize: "var(--text-detail)" }}>
            Why you like them ({match.ourScore}%)
          </h4>
          <p className="text-sm text-muted leading-relaxed">
            {explanation?.whyYouLikeThem ??
              `You scored them ${match.ourScore}% compatibility.`}
          </p>
        </div>
      </div>

      {onInspect ? (
        <button
          className="mt-auto flex items-center gap-1.5 text-pear font-medium self-center"
          style={{ fontSize: "var(--text-detail)" }}
          onClick={(e) => { e.stopPropagation(); onInspect(); }}
        >
          View Breakdown &rarr;
        </button>
      ) : (
        <p className="mt-auto text-muted" style={{ fontSize: "var(--text-caption)" }}>Click to flip back</p>
      )}
    </div>
  );
}

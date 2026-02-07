"use client";

import { motion, AnimatePresence } from "framer-motion";
import { FruitAvatar } from "@/components/act1/FruitAvatar";
import { AttributeTagList } from "@/components/act1/AttributeTagList";
import { ScoreRing } from "@/components/act2/ScoreRing";
import type {
  FruitType,
  FruitAttributes,
  FruitPreferences,
  MatchResult,
  AttributeScore,
  NumberRange,
  ShineFactor,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

export type InspectTarget =
  | { kind: "source"; fruitType: FruitType; attributes: FruitAttributes; preferences: FruitPreferences }
  | { kind: "match"; fruitType: FruitType; match: MatchResult; rank: number };

interface FruitInspectModalProps {
  target: InspectTarget | null;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ATTR_LABELS: Record<string, string> = {
  size: "Size",
  weight: "Weight",
  hasStem: "Stem",
  hasLeaf: "Leaf",
  hasWorm: "Worm",
  shineFactor: "Shine",
  hasChemicals: "Chemicals",
};

function formatPreference(key: string, value: unknown): string | null {
  if (value === null || value === undefined) return null;

  // NumberRange
  if (typeof value === "object" && !Array.isArray(value)) {
    const range = value as NumberRange;
    if (range.min != null && range.max != null) return `${range.min}\u2013${range.max}`;
    if (range.min != null) return `\u2265${range.min}`;
    if (range.max != null) return `\u2264${range.max}`;
    return null;
  }

  // boolean
  if (typeof value === "boolean") return value ? "Yes" : "No";

  // ShineFactor[]
  if (Array.isArray(value)) {
    return (value as ShineFactor[]).map(capitalizeShineFactor).join(", ");
  }

  // single ShineFactor string
  if (typeof value === "string") return capitalizeShineFactor(value as ShineFactor);

  return String(value);
}

function capitalizeShineFactor(s: ShineFactor): string {
  switch (s) {
    case "extraShiny": return "Extra Shiny";
    default: return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

function scoreBarColor(score: number): string {
  if (score >= 0.7) return "var(--color-pear)";
  if (score >= 0.4) return "var(--color-orange)";
  return "var(--color-apple)";
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
      {children}
    </h4>
  );
}

function PreferenceTagList({ preferences }: { preferences: FruitPreferences }) {
  const tags = (Object.entries(preferences) as [string, unknown][])
    .map(([k, v]) => {
      const label = ATTR_LABELS[k] ?? k;
      const formatted = formatPreference(k, v);
      return formatted ? `${label}: ${formatted}` : null;
    })
    .filter((t): t is string => t !== null);

  if (tags.length === 0) return <p className="text-xs text-muted">No preferences specified</p>;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs font-medium"
          style={{ background: "var(--color-surface-elevated)" }}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function ScoreBreakdownSection({
  heading,
  scores,
}: {
  heading: string;
  scores: AttributeScore[];
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">{heading}</p>
      {scores.map((s) => (
        <div key={s.attribute} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">{ATTR_LABELS[s.attribute] ?? s.attribute}</span>
            <span className="font-mono text-muted">
              {Math.round(s.score * 100)}% &times; {s.weight.toFixed(1)}
            </span>
          </div>
          {/* Bar */}
          <div className="h-2 w-full rounded-full bg-border/50 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: scoreBarColor(s.score) }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(s.score * 100)}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
          {/* Reason */}
          <p className="text-muted leading-snug" style={{ fontSize: "var(--text-caption, 11px)" }}>
            {s.reason}
          </p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

export function FruitInspectModal({ target, onClose }: FruitInspectModalProps) {
  return (
    <AnimatePresence>
      {target && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="pointer-events-auto max-w-md w-full max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-xl p-6"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                className="absolute top-3 right-3 text-muted hover:text-foreground transition-colors text-lg leading-none"
                onClick={onClose}
                aria-label="Close"
              >
                &times;
              </button>

              {target.kind === "source" ? (
                <SourceContent target={target} />
              ) : (
                <MatchContent target={target} />
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Source fruit content
// ---------------------------------------------------------------------------

function SourceContent({
  target,
}: {
  target: Extract<InspectTarget, { kind: "source" }>;
}) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FruitAvatar fruitType={target.fruitType} attributes={target.attributes} size="md" animate={false} />
        <h3 className="text-lg font-bold">
          Your {target.fruitType === "apple" ? "Apple" : "Orange"}
        </h3>
      </div>

      {/* Attributes */}
      <div>
        <SectionHeading>What I Am</SectionHeading>
        <AttributeTagList attributes={target.attributes} />
      </div>

      {/* Preferences */}
      <div>
        <SectionHeading>What I&rsquo;m Looking For</SectionHeading>
        <PreferenceTagList preferences={target.preferences} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Match fruit content
// ---------------------------------------------------------------------------

function MatchContent({
  target,
}: {
  target: Extract<InspectTarget, { kind: "match" }>;
}) {
  const { match, rank, fruitType } = target;
  const matchFruitType = fruitType === "apple" ? "orange" : "apple";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FruitAvatar fruitType={matchFruitType} attributes={match.attributes} size="md" animate={false} />
        <div className="flex-1">
          <h3 className="text-lg font-bold">Match #{rank}</h3>
        </div>
        <ScoreRing score={match.score} size={48} strokeWidth={3} />
      </div>

      {/* Their profile */}
      <div>
        <SectionHeading>Their Profile</SectionHeading>
        <AttributeTagList attributes={match.attributes} />
      </div>

      {/* Their preferences */}
      <div>
        <SectionHeading>Their Preferences</SectionHeading>
        <PreferenceTagList preferences={match.preferences} />
      </div>

      {/* Score breakdown */}
      <div className="space-y-4">
        <SectionHeading>Score Breakdown</SectionHeading>
        <ScoreBreakdownSection
          heading={`How you rated them (${match.ourScore}/100)`}
          scores={match.breakdown.our}
        />
        <ScoreBreakdownSection
          heading={`How they rated you (${match.theirScore}/100)`}
          scores={match.breakdown.their}
        />
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { NarrationBubble } from "./NarrationBubble";
import { MatchCard } from "./MatchCard";
import { CompatibilityTag } from "./CompatibilityTag";
import { ConfettiCelebration } from "./ConfettiCelebration";
import { FruitAvatar } from "@/components/act1/FruitAvatar";
import { FruitInspectModal, type InspectTarget } from "@/components/shared/FruitInspectModal";
import {
  isLLMError,
  type FruitType,
  type FruitAttributes,
  type FruitPreferences,
  type MatchResult,
  type LLMMatchResponse,
  type LLMErrorResponse,
} from "@/lib/types";

interface MatchmakerNarrationProps {
  fruitType: FruitType;
  matches: MatchResult[];
  llmExplanation: LLMMatchResponse | LLMErrorResponse | null;
  onComplete: () => void;
  fruit: {
    attributes: FruitAttributes;
    preferences: FruitPreferences;
  };
}

export function MatchmakerNarration({
  fruitType,
  matches,
  llmExplanation,
  onComplete,
  fruit,
}: MatchmakerNarrationProps) {
  const [step, setStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [inspectTarget, setInspectTarget] = useState<InspectTarget | null>(null);
  const hasLLM = llmExplanation && !isLLMError(llmExplanation);
  const llm = hasLLM ? (llmExplanation as LLMMatchResponse) : null;

  // Auto-advance through steps
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Step 0: introduction narration (immediate)
    // Step 1: first card (1.5s)
    timers.push(setTimeout(() => setStep(1), 1500));
    // Step 2: second card (2.5s)
    if (matches.length > 1) timers.push(setTimeout(() => setStep(2), 2500));
    // Step 3: third card (3.5s)
    if (matches.length > 2) timers.push(setTimeout(() => setStep(3), 3500));
    // Step 4: closing note (5s)
    timers.push(setTimeout(() => setStep(4), 5000));
    // Step 5: confetti (6.5s)
    if (hasLLM) {
      timers.push(setTimeout(() => {
        setShowConfetti(true);
        setStep(5);
      }, 6500));
    } else {
      timers.push(setTimeout(() => setStep(5), 6500));
    }
    // Step 6: "Start Another" button (7.5s)
    timers.push(setTimeout(() => setStep(6), 7500));

    return () => timers.forEach(clearTimeout);
  }, [matches.length, hasLLM]);

  const handleStartAnother = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <motion.div
      className="flex flex-col items-center gap-6 py-8"
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: -30, transition: { duration: 0.4 } }}
    >
      {/* LLM error banner */}
      {isLLMError(llmExplanation) && (
        <div className="rounded-lg border border-orange-300 bg-orange-50 px-4 py-2 text-sm text-orange-700 dark:border-orange-700 dark:bg-orange-950/30 dark:text-orange-300">
          AI matchmaker unavailable. Showing score summaries.
        </div>
      )}

      {/* Source fruit badge */}
      <motion.button
        className="flex items-center gap-3 rounded-xl border border-border bg-card/80 backdrop-blur-sm px-4 py-2.5 self-start"
        onClick={() => setInspectTarget({
          kind: "source", fruitType, attributes: fruit.attributes, preferences: fruit.preferences,
        })}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <FruitAvatar fruitType={fruitType} attributes={fruit.attributes} size="sm" animate={false} />
        <div className="text-left">
          <p className="text-sm font-semibold">Your {fruitType === "apple" ? "Apple" : "Orange"}</p>
          <p style={{ fontSize: "var(--text-caption)" }} className="text-muted">Tap to inspect</p>
        </div>
      </motion.button>

      {/* Introduction */}
      <NarrationBubble
        text={llm?.introduction ?? "Here are your matches!"}
      />

      {/* Match cards */}
      <div className="flex flex-wrap justify-center gap-4">
        {matches.slice(0, 3).map((match, i) => {
          if (step < i + 1) return null;
          const explanation = llm?.explanations?.find(
            (e) => e.matchRank === i + 1
          );
          return (
            <div key={match.id} className="flex flex-col items-center gap-2">
              <MatchCard
                match={match}
                rank={i + 1}
                explanation={explanation}
                delay={0}
                fruitType={fruitType}
                onInspect={() => setInspectTarget({
                  kind: "match", fruitType, match, rank: i + 1,
                })}
              />
              {/* Compatibility tags */}
              {step >= 4 && explanation?.compatibilityHighlights && (
                <div className="flex flex-wrap gap-1 justify-center max-w-64">
                  {explanation.compatibilityHighlights.map((tag, j) => (
                    <CompatibilityTag
                      key={tag}
                      text={tag}
                      delay={j * 0.12}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Closing note */}
      {step >= 4 && (
        <NarrationBubble
          text={llm?.closingNote ?? "Good luck out there!"}
        />
      )}

      {/* Confetti */}
      <ConfettiCelebration trigger={showConfetti} />

      {/* Start another */}
      {step >= 6 && (
        <motion.button
          className="btn-primary"
          onClick={handleStartAnother}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          Start Another
        </motion.button>
      )}

      {/* Inspect modal */}
      <FruitInspectModal target={inspectTarget} onClose={() => setInspectTarget(null)} />
    </motion.div>
  );
}

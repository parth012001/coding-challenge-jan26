"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  useOrchardStore,
  selectCurrentFruit,
  selectMatches,
  selectLLMExplanation,
} from "@/lib/store";
import { useConversationRunner } from "@/lib/hooks/useConversationRunner";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { TransitionInterlude } from "@/components/shared/TransitionInterlude";
import { ActIndicator } from "./ActIndicator";
import { FruitArrival } from "@/components/act1/FruitArrival";
import { MatchConstellation } from "@/components/act2/MatchConstellation";
import { MatchmakerNarration } from "@/components/act3/MatchmakerNarration";

const gradientMap: Record<string, string> = {
  idle: "var(--gradient-idle)",
  fetching: "var(--gradient-act1)",
  act1: "var(--gradient-act1)",
  act2: "var(--gradient-act2)",
  act3: "var(--gradient-act3)",
  complete: "var(--gradient-act3)",
  error: "none",
};

export function OrchardStage() {
  const conversation = useOrchardStore((s) => s.currentConversation);
  const currentAct = useOrchardStore((s) => s.currentAct);
  const fruit = useOrchardStore(selectCurrentFruit);
  const matches = useOrchardStore(selectMatches);
  const llmExplanation = useOrchardStore(selectLLMExplanation);
  const advanceAct = useOrchardStore((s) => s.advanceAct);
  const completeConversation = useOrchardStore((s) => s.completeConversation);
  const error = useOrchardStore((s) => s.error);
  const fruitTypeChoice = useOrchardStore((s) => s.fruitTypeChoice);
  const { start } = useConversationRunner();

  const [transitioning, setTransitioning] = useState<"2to3" | null>(null);

  const status = conversation?.status ?? "idle";
  const fruitType = conversation?.fruitType ?? "apple";

  const handleRetry = useCallback(() => {
    start(fruitTypeChoice);
  }, [start, fruitTypeChoice]);

  const handleAct1Complete = useCallback(() => {
    advanceAct();
  }, [advanceAct]);

  const handleAct2Complete = useCallback(() => {
    setTransitioning("2to3");
  }, []);

  const handleAct3Complete = useCallback(() => {
    completeConversation();
  }, [completeConversation]);

  const showIndicator =
    status === "act1" || status === "act2" || status === "act3";

  // Derive completion stats
  const topScore = matches.length > 0 ? Math.max(...matches.map((m) => m.score)) : null;
  const matchCount = matches.length;

  return (
    <motion.div
      className="relative flex-1 min-h-[500px] lg:min-h-0"
      style={{ backgroundImage: gradientMap[status] ?? "none" }}
      animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
    >
      {showIndicator && (
        <div className="mb-4">
          <ActIndicator currentAct={currentAct} status={status} />
        </div>
      )}

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <EmptyState
              message="Click 'New Conversation' to generate a fruit and find its perfect match."
              actionLabel="New Conversation"
              onAction={() => start(fruitTypeChoice)}
            />
          </motion.div>
        )}

        {status === "fetching" && (
          <motion.div
            key="fetching"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <LoadingSpinner label="Growing a new fruit..." />
          </motion.div>
        )}

        {status === "act1" && fruit && (
          <motion.div
            key="act1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.97 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <FruitArrival
              fruitType={fruitType}
              attributes={fruit.attributes}
              communication={fruit.communication}
              onComplete={handleAct1Complete}
            />
          </motion.div>
        )}

        {status === "act2" && fruit && !transitioning && (
          <motion.div
            key="act2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <MatchConstellation
              fruitType={fruitType}
              attributes={fruit.attributes}
              matches={matches}
              onComplete={handleAct2Complete}
            />
          </motion.div>
        )}

        {transitioning === "2to3" && (
          <motion.div
            key="transition-2to3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <TransitionInterlude
              variant="drumroll"
              onComplete={() => {
                setTransitioning(null);
                advanceAct();
              }}
            />
          </motion.div>
        )}

        {status === "act3" && (
          <motion.div
            key="act3"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <MatchmakerNarration
              fruitType={fruitType}
              matches={matches}
              llmExplanation={llmExplanation}
              onComplete={handleAct3Complete}
              fruit={{ attributes: fruit!.attributes, preferences: fruit!.preferences }}
            />
          </motion.div>
        )}

        {status === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center gap-5 py-16 text-center"
          >
            {/* Party emoji with shake on entry */}
            <motion.div
              className="text-5xl"
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              🎉
            </motion.div>

            {/* Headline */}
            <motion.p
              className="font-bold"
              style={{ fontSize: "var(--text-headline)" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Match Complete!
            </motion.p>

            {/* Summary stats row */}
            {topScore !== null && (
              <motion.div
                className="flex gap-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-center">
                  <p
                    className="font-mono font-bold text-pear"
                    style={{ fontSize: "var(--text-display)" }}
                  >
                    {topScore}%
                  </p>
                  <p
                    className="text-muted"
                    style={{ fontSize: "var(--text-caption)" }}
                  >
                    Top Match
                  </p>
                </div>
                <div className="text-center">
                  <p
                    className="font-mono font-bold"
                    style={{ fontSize: "var(--text-display)" }}
                  >
                    {matchCount}
                  </p>
                  <p
                    className="text-muted"
                    style={{ fontSize: "var(--text-caption)" }}
                  >
                    Matches Found
                  </p>
                </div>
              </motion.div>
            )}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <motion.button
                className="btn-primary"
                onClick={() => start(fruitTypeChoice)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
              >
                Start Another Match
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <ErrorState
              message={error ?? "Something went wrong. Please try again."}
              onRetry={handleRetry}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { FruitAvatar } from "../act1/FruitAvatar";
import { CandidateFruit } from "./CandidateFruit";
import { ConnectionLine } from "./ConnectionLine";
import { ThreadBundle } from "./ThreadBundle";
import type { FruitType, FruitAttributes, MatchResult } from "@/lib/types";

interface MatchConstellationProps {
  fruitType: FruitType;
  attributes: FruitAttributes;
  matches: MatchResult[];
  onComplete: () => void;
}

const MAIN_SIZE = 120; // "lg"
const CANDIDATE_SIZE = 80; // "md"

function useCandidatePositions(
  containerWidth: number,
  containerHeight: number,
  matches: MatchResult[],
) {
  const n = matches.length;
  const candidateY = containerHeight - 100;
  // Spread candidates across middle 60% of width
  const leftEdge = containerWidth * 0.2;
  const rightEdge = containerWidth * 0.8;
  const spreadWidth = rightEdge - leftEdge;

  return matches.map((match, i) => {
    const x =
      n === 1
        ? containerWidth / 2
        : leftEdge + (spreadWidth * i) / (n - 1);
    // Higher score pulls slightly upward
    const pullStrength = (match.score / 100) * 0.1;
    const y = candidateY - pullStrength * (candidateY - 120);
    return { x, y };
  });
}

export function MatchConstellation({
  fruitType,
  attributes,
  matches,
  onComplete,
}: MatchConstellationProps) {
  const [showContinue, setShowContinue] = useState(false);
  const [showLines, setShowLines] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(480);
  const containerHeight = containerWidth < 400 ? 400 : 500;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const lineTimer = setTimeout(() => setShowLines(true), 600);
    const continueTimer = setTimeout(() => setShowContinue(true), 3000);
    return () => {
      clearTimeout(lineTimer);
      clearTimeout(continueTimer);
    };
  }, []);

  const handleContinue = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Main fruit: top-center
  // Account for "You" label (16px) + gap (8px) above the fruit
  const labelSpace = 24;
  const mainX = containerWidth / 2;
  const mainY = labelSpace + MAIN_SIZE / 2 + 10;
  // Line origin = bottom edge of main fruit circle
  const lineOriginX = mainX;
  const lineOriginY = mainY + MAIN_SIZE / 2;

  const candidatePositions = useCandidatePositions(
    containerWidth,
    containerHeight,
    matches,
  );

  return (
    <motion.div
      className="flex flex-col items-center gap-6 py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -30, transition: { duration: 0.4 } }}
    >
      {/* Constellation container */}
      <div
        ref={containerRef}
        className="constellation-container"
        style={{ height: containerHeight }}
      >
        {/* SVG overlay for connection lines and thread bundles */}
        {showLines && (
          <svg
            className="constellation-svg"
            width={containerWidth}
            height={containerHeight}
          >
            {matches.map((match, i) => {
              const pos = candidatePositions[i];
              if (i < 3) {
                return (
                  <ThreadBundle
                    key={match.id}
                    x1={lineOriginX}
                    y1={lineOriginY}
                    x2={pos.x}
                    y2={pos.y}
                    breakdown={match.breakdown.our}
                    isTopMatch={i === 0}
                    baseDelay={i * 0.3}
                  />
                );
              }
              return (
                <ConnectionLine
                  key={match.id}
                  x1={lineOriginX}
                  y1={lineOriginY}
                  x2={pos.x}
                  y2={pos.y}
                  score={match.score}
                  index={i}
                  delay={0}
                />
              );
            })}
          </svg>
        )}

        {/* Main fruit - top-center, label above */}
        <motion.div
          className="constellation-fruit flex flex-col items-center gap-1"
          style={{
            left: mainX - MAIN_SIZE / 2,
            top: 10,
          }}
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="text-xs text-muted font-medium">You</span>
          <FruitAvatar
            fruitType={fruitType}
            attributes={attributes}
            size="lg"
            animate={false}
          />
        </motion.div>

        {/* Candidate fruits - horizontal row at bottom */}
        {matches.map((match, i) => {
          const pos = candidatePositions[i];
          return (
            <div
              key={match.id}
              className="constellation-fruit"
              style={{
                left: pos.x - CANDIDATE_SIZE / 2,
                top: pos.y - CANDIDATE_SIZE / 2,
              }}
            >
              <CandidateFruit
                fruitType={fruitType}
                attributes={match.attributes}
                score={match.score}
                isTopMatch={i < 3}
                index={i}
                delay={0.4}
              />
            </div>
          );
        })}
      </div>

      {/* Continue button */}
      {showContinue && (
        <motion.button
          className="btn-primary"
          onClick={handleContinue}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          See What the Matchmaker Says
        </motion.button>
      )}
    </motion.div>
  );
}

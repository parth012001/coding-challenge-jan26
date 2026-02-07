"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MatchCardFront } from "./MatchCardFront";
import { MatchCardBack } from "./MatchCardBack";
import type { FruitType, MatchCardProps } from "@/lib/types";

interface ExtendedMatchCardProps extends MatchCardProps {
  fruitType: FruitType;
  onInspect?: () => void;
}

export function MatchCard({
  match,
  rank,
  explanation,
  delay = 0,
  fruitType,
  onInspect,
}: ExtendedMatchCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div
      className={`match-card w-64 ${flipped ? "match-card--flipped" : ""}`}
      onClick={() => setFlipped(!flipped)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setFlipped(!flipped);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Match card rank ${rank}. ${flipped ? "Showing details" : "Click to see details"}`}
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="match-card__inner">
        <MatchCardFront
          match={match}
          rank={rank}
          fruitType={fruitType}
          explanation={explanation}
        />
        <MatchCardBack match={match} explanation={explanation} onInspect={onInspect} />
      </div>
    </motion.div>
  );
}

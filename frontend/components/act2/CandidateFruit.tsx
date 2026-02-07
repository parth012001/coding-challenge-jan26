"use client";

import { motion } from "framer-motion";
import { FruitAvatar } from "../act1/FruitAvatar";
import { ScoreRing } from "./ScoreRing";
import type { FruitType, FruitAttributes } from "@/lib/types";

interface CandidateFruitProps {
  fruitType: FruitType;
  attributes: FruitAttributes;
  score: number;
  isTopMatch: boolean;
  index: number;
  delay?: number;
}

export function CandidateFruit({
  fruitType,
  attributes,
  score,
  isTopMatch,
  index,
  delay = 0,
}: CandidateFruitProps) {
  const oppositeType: FruitType = fruitType === "apple" ? "orange" : "apple";

  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: isTopMatch ? 1 : 0.5,
        scale: 1,
      }}
      transition={{
        type: "spring",
        stiffness: isTopMatch ? 80 : 200,
        damping: 15,
        delay: delay + index * 0.15,
      }}
    >
      <FruitAvatar
        fruitType={oppositeType}
        attributes={attributes}
        size="md"
        animate={false}
      />
      <ScoreRing score={score} size={48} strokeWidth={3} delay={delay + index * 0.15 + 0.3} />
    </motion.div>
  );
}

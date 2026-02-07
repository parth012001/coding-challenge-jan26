"use client";

import { motion } from "framer-motion";
import type { AttributeScore } from "@/lib/types";

interface ThreadBundleProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  breakdown: AttributeScore[];
  isTopMatch: boolean;
  baseDelay: number;
}

export function ThreadBundle({
  x1,
  y1,
  x2,
  y2,
  breakdown,
  isTopMatch,
  baseDelay,
}: ThreadBundleProps) {
  if (!breakdown || breakdown.length === 0) return null;

  const sorted = breakdown.slice().sort((a, b) => b.weight - a.weight);
  const n = sorted.length;
  const maxWeight = Math.max(...sorted.map((t) => t.weight), 1);
  const dy = y2 - y1;
  // Spread threads at the origin so they fan out from the main fruit
  const maxSpread = Math.min(n * 6, 40);

  // Subtle CSS drop-shadow glow for the top match bundle
  const glowFilter = isTopMatch
    ? "drop-shadow(0 0 3px rgba(132, 204, 22, 0.35))"
    : undefined;

  return (
    <g style={glowFilter ? { filter: glowFilter } : undefined}>
      {sorted.map((attr, i) => {
        // Fan out at origin, converge at destination
        const originOffset =
          n === 1 ? 0 : -maxSpread / 2 + (maxSpread * i) / (n - 1);
        const sx = x1 + originOffset;
        // Smooth cubic bezier: drops straight down first, then curves to target
        const d = `M ${sx} ${y1} C ${sx} ${y1 + dy * 0.35}, ${x2} ${y1 + dy * 0.65}, ${x2} ${y2}`;

        const strokeWidth = 1.5 + (attr.weight / maxWeight) * 1.5; // 1.5–3px
        const color = `hsl(${attr.score * 120}, 70%, 50%)`;
        const threadDelay = baseDelay + i * 0.1;

        return (
          <motion.path
            key={attr.attribute}
            d={d}
            className="thread-line"
            stroke={color}
            strokeWidth={strokeWidth}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{
              pathLength: {
                duration: 0.5,
                ease: "easeInOut",
                delay: threadDelay,
              },
              opacity: { duration: 0.2, delay: threadDelay },
            }}
          >
            <title>
              {attr.attribute}: {Math.round(attr.score * 100)}% (weight:{" "}
              {attr.weight.toFixed(1)})
            </title>
          </motion.path>
        );
      })}
    </g>
  );
}

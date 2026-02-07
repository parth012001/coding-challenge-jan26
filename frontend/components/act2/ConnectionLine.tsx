"use client";

import { motion } from "framer-motion";

interface ConnectionLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  score: number;
  index: number;
  delay: number;
}

export function ConnectionLine({
  x1,
  y1,
  x2,
  y2,
  score,
  index,
  delay,
}: ConnectionLineProps) {
  const dy = y2 - y1;
  const d = `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.4}, ${x2} ${y1 + dy * 0.6}, ${x2} ${y2}`;

  const strokeWidth = 1;
  const opacity = 0.15 + (score / 100) * 0.15;
  const stroke = "var(--color-border)";
  const staggerDelay = delay + index * 0.15;

  return (
    <motion.path
      d={d}
      className="connection-line"
      stroke={stroke}
      strokeWidth={strokeWidth}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity }}
      transition={{
        pathLength: { duration: 0.6, ease: "easeInOut", delay: staggerDelay },
        opacity: { duration: 0.3, delay: staggerDelay },
      }}
    />
  );
}

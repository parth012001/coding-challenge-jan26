"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import type { FruitAvatarProps } from "@/lib/types";

const SIZES = { sm: 48, md: 80, lg: 120 };

export function FruitAvatar({
  fruitType,
  attributes,
  size = "md",
  animate = true,
}: FruitAvatarProps) {
  const gradientId = useId();
  const px = SIZES[size];
  const bodyScale = attributes.size
    ? 0.7 + (attributes.size / 14) * 0.6
    : 1;
  const shineClass = attributes.shineFactor
    ? `shine-${attributes.shineFactor}`
    : "shine-neutral";
  const bodyColor = fruitType === "apple" ? "#ef4444" : "#f97316";
  const r = (px * bodyScale) / 2 - 4;

  const content = (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      className={shineClass}
    >
      {/* Stem */}
      {attributes.hasStem && (
        <line
          x1={px / 2}
          y1={px / 2 - r - 1}
          x2={px / 2}
          y2={px / 2 - r - 10}
          stroke="#92400e"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      )}
      {/* Leaf on stem */}
      {attributes.hasLeaf && attributes.hasStem && (
        <ellipse
          cx={px / 2 + 6}
          cy={px / 2 - r - 7}
          rx={5}
          ry={3}
          fill="#22c55e"
          transform={`rotate(30, ${px / 2 + 6}, ${px / 2 - r - 7})`}
        />
      )}
      {/* Body */}
      <circle
        cx={px / 2}
        cy={px / 2}
        r={r}
        fill={bodyColor}
      />
      {/* Extra shiny overlay */}
      {attributes.shineFactor === "extraShiny" && (
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          fill={`url(#${gradientId})`}
        />
      )}
      {/* Worm */}
      {attributes.hasWorm && (
        <g className="animate-wiggle" style={{ transformOrigin: `${px / 2 + r * 0.5}px ${px / 2 + r * 0.3}px` }}>
          <path
            d={`M ${px / 2 + r * 0.4} ${px / 2 + r * 0.2}
                Q ${px / 2 + r * 0.7} ${px / 2 - r * 0.1}
                  ${px / 2 + r * 0.6} ${px / 2 + r * 0.5}`}
            stroke="#65a30d"
            strokeWidth={2}
            fill="none"
            strokeLinecap="round"
          />
          <circle
            cx={px / 2 + r * 0.6}
            cy={px / 2 + r * 0.5}
            r={2}
            fill="#65a30d"
          />
        </g>
      )}
      <defs>
        <radialGradient id={gradientId}>
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );

  if (!animate)
    return (
      <motion.div
        className="inline-block"
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {content}
      </motion.div>
    );

  return (
    <motion.div
      className="inline-block"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.8,
        }}
      >
        {content}
      </motion.div>
    </motion.div>
  );
}

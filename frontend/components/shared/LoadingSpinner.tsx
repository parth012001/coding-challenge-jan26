"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const stages = [
  { emoji: "🌱", label: "Planting seed..." },
  { emoji: "🌿", label: "Sprouting..." },
  { emoji: "🌳", label: "Growing..." },
  { emoji: "🍐", label: "Almost ripe..." },
];

export function LoadingSpinner({ label }: { label?: string }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((s) => (s + 1) % stages.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const current = stages[stage];

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      {/* Pulsing ring behind emoji */}
      <div className="relative flex items-center justify-center">
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 64,
            height: 64,
            border: "2px solid var(--color-pear)",
            opacity: 0.2,
          }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.05, 0.2] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            className="text-4xl"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {current.emoji}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Label */}
      <p className="text-sm text-muted">{label ?? current.label}</p>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {stages.map((_, i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: i <= stage ? 16 : 6,
              background:
                i <= stage ? "var(--color-pear)" : "var(--color-border)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

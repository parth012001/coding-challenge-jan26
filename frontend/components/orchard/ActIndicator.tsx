"use client";

import { motion } from "framer-motion";
import type { Act } from "@/lib/types";

interface ActIndicatorProps {
  currentAct: Act;
  status: string;
}

export function ActIndicator({ currentAct, status }: ActIndicatorProps) {
  const acts: { num: Act; label: string }[] = [
    { num: 1, label: "Arrival" },
    { num: 2, label: "Search" },
    { num: 3, label: "Results" },
  ];

  const isComplete = status === "complete";

  return (
    <div className="flex items-center gap-1 justify-center">
      {acts.map((act, i) => {
        const isActive = act.num === currentAct && !isComplete;
        const isDone = act.num < currentAct || isComplete;

        return (
          <div key={act.num} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative">
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "var(--color-primary)",
                      opacity: 0.3,
                    }}
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
                <div
                  className="relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300"
                  style={{
                    background: isDone
                      ? "var(--color-pear)"
                      : isActive
                        ? "var(--color-primary)"
                        : "var(--color-border)",
                    color: isDone || isActive ? "#fff" : "var(--color-muted)",
                    boxShadow: isDone
                      ? "0 0 8px var(--color-pear-glow)"
                      : isActive
                        ? "0 0 8px rgba(59, 130, 246, 0.4)"
                        : "none",
                  }}
                >
                  {isDone ? "✓" : act.num}
                </div>
              </div>
              <span
                className="text-muted"
                style={{ fontSize: "var(--text-caption)" }}
              >
                {act.label}
              </span>
            </div>
            {i < acts.length - 1 && (
              <div
                className="mb-5 transition-colors duration-300"
                style={{
                  height: 2,
                  width: 48,
                  background: isDone
                    ? "var(--color-pear)"
                    : "var(--color-border)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

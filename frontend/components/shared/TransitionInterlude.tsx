"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

interface TransitionInterludeProps {
  variant: "searching" | "drumroll";
  onComplete: () => void;
}

function SearchingInterlude() {
  const dots = [
    { emoji: "🍎", color: "var(--color-apple)" },
    { emoji: "🍊", color: "var(--color-orange)" },
    { emoji: "🍐", color: "var(--color-pear)" },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative h-16 w-16 flex items-center justify-center">
        {dots.map((dot, i) => {
          const angle = (i * 360) / dots.length;
          return (
            <motion.div
              key={i}
              className="absolute text-lg"
              animate={{
                rotate: [angle, angle + 360],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{ transformOrigin: "0 0" }}
            >
              <motion.span
                className="block"
                style={{
                  transform: `translate(20px, -8px)`,
                }}
              >
                {dot.emoji}
              </motion.span>
            </motion.div>
          );
        })}
      </div>
      <motion.p
        className="text-sm text-muted"
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      >
        Scanning the orchard...
      </motion.p>
    </div>
  );
}

function DrumrollInterlude() {
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="text-4xl"
        animate={{
          rotate: [-8, 8, -8],
          x: [-3, 3, -3],
        }}
        transition={{
          duration: 0.15,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        🥁
      </motion.div>
      <motion.p
        className="text-sm text-muted"
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
      >
        The matchmaker has spoken...
      </motion.p>
    </div>
  );
}

export function TransitionInterlude({
  variant,
  onComplete,
}: TransitionInterludeProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="flex items-center justify-center py-8"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.3 }}
    >
      {variant === "searching" ? (
        <SearchingInterlude />
      ) : (
        <DrumrollInterlude />
      )}
    </motion.div>
  );
}

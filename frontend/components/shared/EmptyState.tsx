"use client";

import { motion } from "framer-motion";

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const floatingFruits = [
  { emoji: "🍎", x: "15%", y: "20%", duration: 5 },
  { emoji: "🍊", x: "75%", y: "30%", duration: 6.5 },
  { emoji: "🍐", x: "50%", y: "65%", duration: 5.5 },
];

export function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div
      className="relative flex flex-col items-center justify-center gap-4 py-16 text-center overflow-hidden"
      style={{ backgroundImage: "var(--gradient-idle)" }}
    >
      {/* Floating background fruits */}
      {floatingFruits.map((fruit, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl pointer-events-none select-none"
          style={{ left: fruit.x, top: fruit.y, opacity: 0.25 }}
          animate={{
            y: [0, -12, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: fruit.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        >
          {fruit.emoji}
        </motion.div>
      ))}

      {/* Central pear with breathing */}
      <motion.div
        className="text-5xl relative z-10"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        🍐
      </motion.div>

      <p className="max-w-sm text-muted relative z-10">{message}</p>

      {actionLabel && onAction && (
        <motion.button
          className="btn-primary relative z-10"
          onClick={onAction}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          {actionLabel}
        </motion.button>
      )}
    </div>
  );
}

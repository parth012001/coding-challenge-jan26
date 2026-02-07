"use client";

import { motion } from "framer-motion";
import { useTypewriter } from "@/lib/hooks/useTypewriter";
import type { TypewriterBubbleProps } from "@/lib/types";

export function TypewriterBubble({
  text,
  variant,
  speed,
  delay = 0,
  onComplete,
}: TypewriterBubbleProps) {
  const { displayedText, isComplete, skip } = useTypewriter(
    text,
    speed,
    delay,
    onComplete
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay / 1000 }}
      className={`chat-bubble chat-bubble--${variant} cursor-pointer`}
      onClick={skip}
    >
      <p className="whitespace-pre-wrap">
        {displayedText}
        {!isComplete && (
          <span className="animate-cursor-blink ml-0.5 inline-block w-[2px] h-[1em] bg-current align-text-bottom" />
        )}
      </p>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useTypewriter } from "@/lib/hooks/useTypewriter";

interface NarrationBubbleProps {
  text: string;
  delay?: number;
  onComplete?: () => void;
}

export function NarrationBubble({ text, delay = 0, onComplete }: NarrationBubbleProps) {
  const { displayedText, isComplete, skip } = useTypewriter(
    text,
    25,
    delay,
    onComplete
  );

  return (
    <motion.div
      className="chat-bubble chat-bubble--matchmaker cursor-pointer max-w-lg"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay / 1000 }}
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

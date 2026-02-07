"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { FruitAvatar } from "./FruitAvatar";
import { TypewriterBubble } from "./TypewriterBubble";
import { AttributeTagList } from "./AttributeTagList";
import { TransitionInterlude } from "@/components/shared/TransitionInterlude";
import type { FruitType, FruitAttributes, FruitCommunication } from "@/lib/types";

interface FruitArrivalProps {
  fruitType: FruitType;
  attributes: FruitAttributes;
  communication: FruitCommunication;
  onComplete: () => void;
}

export function FruitArrival({
  fruitType,
  attributes,
  communication,
  onComplete,
}: FruitArrivalProps) {
  const [firstDone, setFirstDone] = useState(false);
  const [secondDone, setSecondDone] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleFirstComplete = useCallback(() => setFirstDone(true), []);
  const handleSecondComplete = useCallback(() => {
    setSecondDone(true);
  }, []);

  const handleContinue = useCallback(() => {
    setSearching(true);
  }, []);

  return (
    <motion.div
      className="flex flex-col items-center gap-6 py-8"
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: -30, scale: 0.97, transition: { duration: 0.4 } }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.4 } },
      }}
    >
      {/* Avatar */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1 },
        }}
      >
        <FruitAvatar fruitType={fruitType} attributes={attributes} size="lg" />
      </motion.div>

      {/* Attributes bubble */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1 },
        }}
      >
        <TypewriterBubble
          text={communication.attributes}
          variant={fruitType}
          onComplete={handleFirstComplete}
        />
      </motion.div>

      {/* Tags */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1 },
        }}
      >
        <AttributeTagList attributes={attributes} />
      </motion.div>

      {/* Preferences bubble (appears after first completes) */}
      {firstDone && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <TypewriterBubble
            text={communication.preferences}
            variant={fruitType}
            delay={400}
            onComplete={handleSecondComplete}
          />
        </motion.div>
      )}

      {/* Continue button — user controls when to advance */}
      {secondDone && !searching && (
        <motion.button
          className="btn-primary"
          onClick={handleContinue}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          Find My Match
        </motion.button>
      )}

      {/* Searching interlude — only after user clicks continue */}
      {searching && (
        <TransitionInterlude variant="searching" onComplete={onComplete} />
      )}
    </motion.div>
  );
}

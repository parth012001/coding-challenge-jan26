"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TYPEWRITER_SPEED } from "../constants";

export function useTypewriter(
  text: string,
  speed = TYPEWRITER_SPEED,
  delay = 0,
  onComplete?: () => void
) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayedText("");
    setIsComplete(false);

    const delayTimer = setTimeout(() => {
      const tick = () => {
        if (indexRef.current < text.length) {
          indexRef.current++;
          setDisplayedText(text.slice(0, indexRef.current));
          timerRef.current = setTimeout(tick, speed);
        } else {
          setIsComplete(true);
          onComplete?.();
        }
      };
      tick();
    }, delay);

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, speed, delay]);

  const skip = useCallback(() => {
    clearTimeout(timerRef.current);
    setDisplayedText(text);
    setIsComplete(true);
    onComplete?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return { displayedText, isComplete, skip };
}

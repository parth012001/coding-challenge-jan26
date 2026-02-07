"use client";

import { useEffect, useRef } from "react";
import { useConfetti } from "@/lib/hooks/useConfetti";

export function ConfettiCelebration({ trigger }: { trigger: boolean }) {
  const { fire } = useConfetti();
  const firedRef = useRef(false);

  useEffect(() => {
    if (trigger && !firedRef.current) {
      firedRef.current = true;
      fire();
    }
  }, [trigger, fire]);

  return null;
}

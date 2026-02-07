"use client";

import { useCallback, useRef } from "react";
import { useOrchardStore } from "../store";
import { callEdgeFunction } from "../api";
import type { FruitType } from "../types";

export function useConversationRunner() {
  const startConversation = useOrchardStore((s) => s.startConversation);
  const setConversationData = useOrchardStore((s) => s.setConversationData);
  const setError = useOrchardStore((s) => s.setError);
  const abortRef = useRef<AbortController>(undefined);

  const start = useCallback(
    async (fruitType: FruitType) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const id = startConversation(fruitType);

      try {
        const data = await callEdgeFunction(fruitType, controller.signal);
        if (controller.signal.aborted) return;

        const fruitData = data.apple ?? data.orange;
        if (!fruitData) {
          throw new Error("No fruit data in response");
        }

        setConversationData(
          id,
          fruitData,
          data.matches,
          data.totalCandidates,
          data.llmExplanation
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "Failed to start conversation"
        );
      }
    },
    [startConversation, setConversationData, setError]
  );

  return { start };
}

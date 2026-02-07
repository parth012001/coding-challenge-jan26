"use client";

import { useOrchardStore, selectIsActive } from "@/lib/store";
import { useConversationRunner } from "@/lib/hooks/useConversationRunner";
import type { FruitType } from "@/lib/types";

export function Header() {
  const fruitTypeChoice = useOrchardStore((s) => s.fruitTypeChoice);
  const setFruitTypeChoice = useOrchardStore((s) => s.setFruitTypeChoice);
  const isLoading = useOrchardStore((s) => s.isLoading);
  const isActive = useOrchardStore(selectIsActive);
  const { start } = useConversationRunner();

  const handleNewConversation = () => {
    if (isActive || isLoading) return;
    start(fruitTypeChoice);
  };

  const choices: FruitType[] = ["apple", "orange"];

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-[var(--z-header)]">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Orchard</h1>
            <p className="text-muted" style={{ fontSize: "var(--text-caption)" }}>
              Creating perfect pears, one match at a time
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Fruit type toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              {choices.map((type) => (
                <button
                  key={type}
                  onClick={() => setFruitTypeChoice(type)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    fruitTypeChoice === type
                      ? type === "apple"
                        ? "bg-apple/10 text-apple"
                        : "bg-orange/10 text-orange"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {type === "apple" ? "🍎 Apple" : "🍊 Orange"}
                </button>
              ))}
            </div>

            <button
              className="btn-primary"
              onClick={handleNewConversation}
              disabled={isActive || isLoading}
            >
              {isLoading ? "Creating..." : "New Conversation"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

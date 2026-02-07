import type { FruitType } from "./types";

export const ATTRIBUTE_WEIGHTS: Record<string, number> = {
  hasWorm: 5.0,
  hasChemicals: 3.0,
  size: 2.0,
  weight: 2.0,
  shineFactor: 1.5,
  hasStem: 1.0,
  hasLeaf: 0.5,
};

export const SHINE_ORDER = ["dull", "neutral", "shiny", "extraShiny"] as const;

export const FRUIT_COLORS: Record<FruitType, string> = {
  apple: "var(--color-apple)",
  orange: "var(--color-orange)",
};

export const TYPEWRITER_SPEED = 25; // ms per character
export const ACT_TRANSITION_DELAY = 1500; // ms pause between acts

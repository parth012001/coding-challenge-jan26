"use client";

import type { FruitType } from "@/lib/types";

export function FruitIcon({
  type,
  size = 24,
}: {
  type: FruitType;
  size?: number;
}) {
  return (
    <span
      style={{ fontSize: size }}
      className={type === "apple" ? "text-apple" : "text-orange"}
    >
      {type === "apple" ? "🍎" : "🍊"}
    </span>
  );
}

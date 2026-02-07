"use client";

import { motion } from "framer-motion";
import type { FruitAttributes } from "@/lib/types";

function formatTag(key: string, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  switch (key) {
    case "size":
      return `Size: ${value}`;
    case "weight":
      return `Weight: ${value}g`;
    case "shineFactor":
      return `Shine: ${value}`;
    case "hasStem":
      return value ? "Has Stem" : "No Stem";
    case "hasLeaf":
      return value ? "Has Leaf" : "No Leaf";
    case "hasWorm":
      return value ? "Has Worm" : "Worm-Free";
    case "hasChemicals":
      return value ? "Chemical-Treated" : "All Natural";
    default:
      return null;
  }
}

export function AttributeTagList({
  attributes,
}: {
  attributes: FruitAttributes;
}) {
  const tags = (
    Object.entries(attributes) as [string, unknown][]
  )
    .map(([k, v]) => formatTag(k, v))
    .filter((t): t is string => t !== null);

  return (
    <motion.div
      className="flex flex-wrap gap-2"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {tags.map((tag) => (
        <motion.span
          key={tag}
          className="rounded-full border border-border bg-surface-elevated px-3 py-1 text-xs font-medium"
          style={{ background: "var(--color-surface-elevated)" }}
          variants={{
            hidden: { opacity: 0, scale: 0.8 },
            show: {
              opacity: 1,
              scale: 1,
              transition: { type: "spring", stiffness: 300, damping: 20 },
            },
          }}
        >
          {tag}
        </motion.span>
      ))}
    </motion.div>
  );
}

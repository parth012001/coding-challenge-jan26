/**
 * Tests for Bidirectional Mutual Scoring
 *
 * Validates that the mutual matching logic (both directions + average)
 * produces correct, symmetric, and properly-ranked results.
 *
 * Run with:
 * ~/.deno/bin/deno test --allow-env --config supabase/functions/_shared/deno.json supabase/functions/_shared/mutualScoring.test.ts
 */

import {
  assertEquals,
  assertAlmostEquals,
  assert,
} from "std/assert";

import {
  calculateWeightedGradientScore,
  type FruitRecord,
} from "./surrealClient.ts";

// ============================================================================
// Helpers
// ============================================================================

function makeAttrs(overrides: Partial<FruitRecord["attributes"]> = {}): FruitRecord["attributes"] {
  return {
    size: 7, weight: 180, hasStem: true, hasLeaf: false,
    hasWorm: false, shineFactor: "shiny", hasChemicals: false,
    ...overrides,
  };
}

function makePrefs(overrides: Partial<FruitRecord["preferences"]> = {}): FruitRecord["preferences"] {
  return { ...overrides };
}

/** Simulates the mutual scoring logic from findMatches without DB */
function mutualScore(
  ourPrefs: FruitRecord["preferences"],
  ourAttrs: FruitRecord["attributes"],
  theirPrefs: FruitRecord["preferences"],
  theirAttrs: FruitRecord["attributes"],
) {
  const ourResult = calculateWeightedGradientScore(ourPrefs, theirAttrs);
  const theirResult = calculateWeightedGradientScore(theirPrefs, ourAttrs);
  const mutual = Math.round((ourResult.score + theirResult.score) / 2);
  return { mutual, ourScore: ourResult.score, theirScore: theirResult.score };
}

// ============================================================================
// Bidirectional Scoring Tests
// ============================================================================

Deno.test("Mutual scoring - perfect match both directions", () => {
  const applePrefs = makePrefs({ size: { min: 5, max: 10 }, hasWorm: false });
  const appleAttrs = makeAttrs({ size: 7, hasWorm: false });
  const orangePrefs = makePrefs({ size: { min: 5, max: 10 }, hasWorm: false });
  const orangeAttrs = makeAttrs({ size: 7, hasWorm: false });

  const result = mutualScore(applePrefs, appleAttrs, orangePrefs, orangeAttrs);

  assertEquals(result.ourScore, 100);
  assertEquals(result.theirScore, 100);
  assertEquals(result.mutual, 100);
});

Deno.test("Mutual scoring - one-sided mismatch penalizes mutual", () => {
  // Apple has great attributes but orange has worm
  const applePrefs = makePrefs({ hasWorm: false });
  const appleAttrs = makeAttrs({ hasWorm: false }); // Apple is clean
  const orangePrefs = makePrefs({ hasWorm: false });
  const orangeAttrs = makeAttrs({ hasWorm: true }); // Orange has worm

  const result = mutualScore(applePrefs, appleAttrs, orangePrefs, orangeAttrs);

  assertEquals(result.ourScore, 0, "Apple should hate the worm");
  assertEquals(result.theirScore, 100, "Orange should be happy (apple is clean)");
  assertEquals(result.mutual, 50, "Mutual should average to 50");
});

Deno.test("Mutual scoring - asymmetric preferences", () => {
  // Apple cares about size, orange cares about worm
  const applePrefs = makePrefs({ size: { min: 5, max: 10 } });
  const appleAttrs = makeAttrs({ hasWorm: false });
  const orangePrefs = makePrefs({ hasWorm: false });
  const orangeAttrs = makeAttrs({ size: 7 });

  const result = mutualScore(applePrefs, appleAttrs, orangePrefs, orangeAttrs);

  assertEquals(result.ourScore, 100, "Orange size 7 is in apple's range");
  assertEquals(result.theirScore, 100, "Apple has no worm");
  assertEquals(result.mutual, 100);
});

Deno.test("Mutual scoring - both disappointed", () => {
  const applePrefs = makePrefs({ hasWorm: false, hasChemicals: false });
  const appleAttrs = makeAttrs({ hasWorm: true, hasChemicals: true }); // Apple is bad
  const orangePrefs = makePrefs({ hasWorm: false, hasChemicals: false });
  const orangeAttrs = makeAttrs({ hasWorm: true, hasChemicals: true }); // Orange is bad

  const result = mutualScore(applePrefs, appleAttrs, orangePrefs, orangeAttrs);

  assertEquals(result.ourScore, 0, "Apple hates both");
  assertEquals(result.theirScore, 0, "Orange hates both");
  assertEquals(result.mutual, 0);
});

Deno.test("Mutual scoring - no preferences from either = 100", () => {
  const result = mutualScore(makePrefs(), makeAttrs(), makePrefs(), makeAttrs());
  assertEquals(result.mutual, 100, "No preferences = no complaints = 100");
});

// ============================================================================
// Ranking / Sort Order Tests
// ============================================================================

Deno.test("Ranking - candidates sort by mutual score descending", () => {
  const myPrefs = makePrefs({ size: { min: 5, max: 10 }, hasWorm: false });
  const myAttrs = makeAttrs({ size: 7, hasWorm: false });

  const candidates = [
    { prefs: makePrefs({ hasWorm: false }), attrs: makeAttrs({ size: 7, hasWorm: false }) },     // perfect
    { prefs: makePrefs({ hasWorm: false }), attrs: makeAttrs({ size: 14, hasWorm: false }) },     // size way off
    { prefs: makePrefs({ hasWorm: false }), attrs: makeAttrs({ size: 7, hasWorm: true }) },       // has worm
  ];

  const scored = candidates
    .map((c) => mutualScore(myPrefs, myAttrs, c.prefs, c.attrs))
    .sort((a, b) => b.mutual - a.mutual);

  assert(scored[0].mutual > scored[1].mutual, "Best should beat middle");
  assert(scored[1].mutual > scored[2].mutual, "Middle should beat worst");
});

Deno.test("Ranking - top match is actually the best mutual score", () => {
  const myPrefs = makePrefs({ size: { min: 6, max: 9 }, hasWorm: false, shineFactor: "shiny" });
  const myAttrs = makeAttrs({ size: 7, hasWorm: false, shineFactor: "shiny" });

  const candidates = [
    { label: "perfect", prefs: makePrefs({ size: { min: 6, max: 9 } }), attrs: makeAttrs({ size: 7, hasWorm: false, shineFactor: "shiny" }) },
    { label: "good", prefs: makePrefs({ size: { min: 6, max: 9 } }), attrs: makeAttrs({ size: 10, hasWorm: false, shineFactor: "neutral" }) },
    { label: "bad", prefs: makePrefs({ hasWorm: false }), attrs: makeAttrs({ size: 14, hasWorm: true, shineFactor: "dull" }) },
  ];

  const scored = candidates
    .map((c) => ({ ...mutualScore(myPrefs, myAttrs, c.prefs, c.attrs), label: c.label }))
    .sort((a, b) => b.mutual - a.mutual);

  assertEquals(scored[0].label, "perfect", "Top match should be the perfect candidate");
  assertEquals(scored[scored.length - 1].label, "bad", "Worst match should be the bad candidate");
});

// ============================================================================
// Symmetry Tests
// ============================================================================

Deno.test("Symmetry - mutual score unchanged if we swap sides", () => {
  const prefsA = makePrefs({ size: { min: 5, max: 10 }, hasWorm: false });
  const attrsA = makeAttrs({ size: 8, hasWorm: false });
  const prefsB = makePrefs({ shineFactor: "shiny", hasChemicals: false });
  const attrsB = makeAttrs({ size: 11, shineFactor: "neutral" });

  const forward = mutualScore(prefsA, attrsA, prefsB, attrsB);
  const reverse = mutualScore(prefsB, attrsB, prefsA, attrsA);

  assertEquals(forward.mutual, reverse.mutual, "Mutual score should be same regardless of direction");
  assertEquals(forward.ourScore, reverse.theirScore, "Our→Their should flip");
  assertEquals(forward.theirScore, reverse.ourScore, "Their→Our should flip");
});

// ============================================================================
// Edge Cases
// ============================================================================

Deno.test("Edge - one side has all null attributes", () => {
  const myPrefs = makePrefs({ size: { min: 5, max: 10 }, hasWorm: false });
  const myAttrs = makeAttrs();
  const theirPrefs = makePrefs({ hasWorm: false });
  const nullAttrs = makeAttrs({
    size: null, weight: null, hasStem: null, hasLeaf: null,
    hasWorm: null, shineFactor: null, hasChemicals: null,
  });

  const result = mutualScore(myPrefs, myAttrs, theirPrefs, nullAttrs);

  // Our score: null attrs → 50% for each
  assertEquals(result.ourScore, 50, "Null attributes should score 50%");
  // Their score: they want no worm, my attrs have hasWorm: false → 100%
  assertEquals(result.theirScore, 100);
  assertEquals(result.mutual, 75, "Average of 50 and 100");
});

Deno.test("Edge - single attribute preference", () => {
  const result = mutualScore(
    makePrefs({ hasWorm: false }),
    makeAttrs(),
    makePrefs({ hasStem: true }),
    makeAttrs({ hasWorm: false }),
  );

  assertEquals(result.ourScore, 100, "No worm = perfect");
  assertEquals(result.theirScore, 100, "Has stem = perfect");
  assertEquals(result.mutual, 100);
});

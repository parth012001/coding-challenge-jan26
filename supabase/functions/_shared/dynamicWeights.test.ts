/**
 * Tests for Dynamic Selectivity-Based Weights
 *
 * Run with:
 * deno test --allow-env --config supabase/functions/_shared/deno.json supabase/functions/_shared/dynamicWeights.test.ts
 */

import {
  assertEquals,
  assertAlmostEquals,
  assert,
} from "std/assert";

import {
  calculateDynamicWeight,
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
// Section A: Unit Tests for calculateDynamicWeight (8 tests)
// ============================================================================

Deno.test("DynWeight A1 - narrow size range {min:6,max:7} amplifies weight", () => {
  const prefs = makePrefs({ size: { min: 6, max: 7 } });
  const weight = calculateDynamicWeight("size", prefs);
  // rangeWidth=1, selectivity=11/12, weight=2*(1+0.5*11/12)=70/24≈2.9167
  assertAlmostEquals(weight, 2.9167, 0.01);
  assert(weight > 2.0, "Narrow range should amplify above base weight 2.0");
});

Deno.test("DynWeight A2 - wide size range {min:3,max:12} stays near base", () => {
  const prefs = makePrefs({ size: { min: 3, max: 12 } });
  const weight = calculateDynamicWeight("size", prefs);
  // rangeWidth=9, selectivity=0.25, weight=2*1.125=2.25
  assertAlmostEquals(weight, 2.25, 0.01);
});

Deno.test("DynWeight A3 - min-only range {min:5} defaults max to domain boundary", () => {
  const prefs = makePrefs({ size: { min: 5 } });
  const weight = calculateDynamicWeight("size", prefs);
  // effectiveMax=14, rangeWidth=9, selectivity=0.25, weight=2.25
  assertAlmostEquals(weight, 2.25, 0.01);
});

Deno.test("DynWeight A4 - max-only range {max:8} defaults min to domain boundary", () => {
  const prefs = makePrefs({ size: { max: 8 } });
  const weight = calculateDynamicWeight("size", prefs);
  // effectiveMin=2, rangeWidth=6, selectivity=0.5, weight=2.5
  assertAlmostEquals(weight, 2.5, 0.01);
});

Deno.test("DynWeight A5 - single shine value amplifies weight", () => {
  const prefs = makePrefs({ shineFactor: "shiny" });
  const weight = calculateDynamicWeight("shineFactor", prefs);
  // selectivity=1-(1/4)=0.75, weight=1.5*(1+0.5*0.75)=2.0625
  assertAlmostEquals(weight, 2.0625, 0.01);
});

Deno.test("DynWeight A6 - three shine values stays near base", () => {
  const prefs = makePrefs({ shineFactor: ["shiny", "neutral", "dull"] });
  const weight = calculateDynamicWeight("shineFactor", prefs);
  // selectivity=1-(3/4)=0.25, weight=1.5*1.125=1.6875
  assertAlmostEquals(weight, 1.6875, 0.01);
});

Deno.test("DynWeight A7 - boolean specified gets 1.2x amplification", () => {
  const prefs = makePrefs({ hasWorm: false });
  const weight = calculateDynamicWeight("hasWorm", prefs);
  // 5.0 * 1.2 = 6.0
  assertEquals(weight, 6.0);
});

Deno.test("DynWeight A8 - no preference set returns base weight", () => {
  const prefs = makePrefs({}); // no size preference
  const weight = calculateDynamicWeight("size", prefs);
  assertEquals(weight, 2.0, "Should return base weight when no preference set");
});

// ============================================================================
// Section B: Integration Tests (4 tests)
// ============================================================================

Deno.test("DynWeight B1 - narrow size pref + perfect match produces high weight in breakdown", () => {
  const prefs = makePrefs({ size: { min: 6, max: 7 } });
  const attrs = makeAttrs({ size: 7 });
  const result = calculateWeightedGradientScore(prefs, attrs);
  const sizeEntry = result.breakdown.find((b) => b.attribute === "size");
  assert(sizeEntry !== undefined);
  assert(sizeEntry.weight > 2.5, `Narrow size weight should be > 2.5 (got ${sizeEntry.weight})`);
});

Deno.test("DynWeight B2 - wide size pref + perfect match produces low weight in breakdown", () => {
  const prefs = makePrefs({ size: { min: 3, max: 12 } });
  const attrs = makeAttrs({ size: 7 });
  const result = calculateWeightedGradientScore(prefs, attrs);
  const sizeEntry = result.breakdown.find((b) => b.attribute === "size");
  assert(sizeEntry !== undefined);
  assert(sizeEntry.weight < 2.5, `Wide size weight should be < 2.5 (got ${sizeEntry.weight})`);
});

Deno.test("DynWeight B3 - narrow vs wide same attribute produces different weights", () => {
  const narrowPrefs = makePrefs({ size: { min: 6, max: 7 } });
  const widePrefs = makePrefs({ size: { min: 3, max: 12 } });
  const attrs = makeAttrs({ size: 7 });

  const narrowResult = calculateWeightedGradientScore(narrowPrefs, attrs);
  const wideResult = calculateWeightedGradientScore(widePrefs, attrs);

  const narrowWeight = narrowResult.breakdown.find((b) => b.attribute === "size")!.weight;
  const wideWeight = wideResult.breakdown.find((b) => b.attribute === "size")!.weight;

  assert(narrowWeight > wideWeight, `Narrow weight (${narrowWeight}) should be > wide weight (${wideWeight})`);
});

Deno.test("DynWeight B4 - narrow size miss + wide shine hit produces low score (narrow dominates)", () => {
  // Narrow size pref but miss, wide shine pref and hit
  const prefs = makePrefs({
    size: { min: 6, max: 7 },                                    // narrow → high weight
    shineFactor: ["shiny", "neutral", "dull", "extraShiny"],      // all 4 → base weight
  });
  const attrs = makeAttrs({
    size: 14,          // way outside narrow range
    shineFactor: "shiny", // matches
  });

  const result = calculateWeightedGradientScore(prefs, attrs);
  assert(result.score < 70, `Score should be < 70 when narrow-weighted attribute misses (got ${result.score})`);
});

// ============================================================================
// Section C: Regression Tests (6 tests)
// ============================================================================

Deno.test("DynWeight C1 - no preferences returns score 100", () => {
  const prefs = makePrefs({});
  const attrs = makeAttrs();
  const result = calculateWeightedGradientScore(prefs, attrs);
  assertEquals(result.score, 100);
});

Deno.test("DynWeight C2 - perfect match all attributes returns score 100", () => {
  const prefs = makePrefs({
    size: { min: 5, max: 10 },
    weight: { min: 100, max: 200 },
    hasStem: true,
    hasLeaf: false,
    hasWorm: false,
    shineFactor: "shiny",
    hasChemicals: false,
  });
  const attrs = makeAttrs({
    size: 7,
    weight: 180,
    hasStem: true,
    hasLeaf: false,
    hasWorm: false,
    shineFactor: "shiny",
    hasChemicals: false,
  });
  const result = calculateWeightedGradientScore(prefs, attrs);
  assertEquals(result.score, 100);
});

Deno.test("DynWeight C3 - all null attributes score 50", () => {
  const prefs = makePrefs({
    size: { min: 5, max: 10 },
    hasWorm: false,
    shineFactor: "shiny",
  });
  const attrs = makeAttrs({
    size: null,
    hasWorm: null,
    shineFactor: null,
  });
  const result = calculateWeightedGradientScore(prefs, attrs);
  assertEquals(result.score, 50);
});

Deno.test("DynWeight C4 - mutual scoring symmetry preserved", () => {
  const prefsA = makePrefs({ size: { min: 5, max: 10 }, hasWorm: false });
  const attrsA = makeAttrs({ size: 8, hasWorm: false });
  const prefsB = makePrefs({ shineFactor: "shiny", hasChemicals: false });
  const attrsB = makeAttrs({ size: 11, shineFactor: "neutral" });

  const forward = mutualScore(prefsA, attrsA, prefsB, attrsB);
  const reverse = mutualScore(prefsB, attrsB, prefsA, attrsA);

  assertEquals(forward.mutual, reverse.mutual, "Mutual score should be same regardless of direction");
  assertEquals(forward.ourScore, reverse.theirScore);
  assertEquals(forward.theirScore, reverse.ourScore);
});

Deno.test("DynWeight C5 - ranking order: perfect > good > bad", () => {
  const myPrefs = makePrefs({ size: { min: 6, max: 9 }, hasWorm: false });
  const attrs = makeAttrs();

  const perfect = makeAttrs({ size: 7, hasWorm: false });
  const good = makeAttrs({ size: 11, hasWorm: false });
  const bad = makeAttrs({ size: 14, hasWorm: true });

  const perfectResult = calculateWeightedGradientScore(myPrefs, perfect);
  const goodResult = calculateWeightedGradientScore(myPrefs, good);
  const badResult = calculateWeightedGradientScore(myPrefs, bad);

  assert(perfectResult.score > goodResult.score, "Perfect should beat good");
  assert(goodResult.score > badResult.score, "Good should beat bad");
});

Deno.test("DynWeight C6 - one-sided worm mismatch produces mutual score of 50", () => {
  const result = mutualScore(
    makePrefs({ hasWorm: false }),
    makeAttrs({ hasWorm: false }),
    makePrefs({ hasWorm: false }),
    makeAttrs({ hasWorm: true }),
  );
  assertEquals(result.ourScore, 0, "We hate the worm");
  assertEquals(result.theirScore, 100, "They're happy (we have no worm)");
  assertEquals(result.mutual, 50);
});

// ============================================================================
// Section D: Comparison Tests (2 tests)
// ============================================================================

Deno.test("DynWeight D1 - narrow size vs all-shine-accepted: size/shine weight ratio > 1.8", () => {
  const prefs = makePrefs({
    size: { min: 6, max: 7 },                                // narrow → ~2.917
    shineFactor: ["shiny", "neutral", "dull", "extraShiny"],  // all 4 → 1.5 (base)
  });
  const sizeWeight = calculateDynamicWeight("size", prefs);
  const shineWeight = calculateDynamicWeight("shineFactor", prefs);
  const ratio = sizeWeight / shineWeight;
  assert(ratio > 1.8, `Size/shine weight ratio should be > 1.8 (got ${ratio.toFixed(3)})`);
});

Deno.test("DynWeight D2 - same attribute different range widths produce different weights", () => {
  const narrow = calculateDynamicWeight("weight", makePrefs({ weight: { min: 150, max: 160 } }));
  const wide = calculateDynamicWeight("weight", makePrefs({ weight: { min: 50, max: 350 } }));
  assert(narrow > wide, `Narrow weight (${narrow}) should exceed wide weight (${wide})`);
});

// ============================================================================
// Section E: Edge Cases (4 tests)
// ============================================================================

Deno.test("DynWeight E1 - min equals max gives selectivity 1.0, max amplification", () => {
  const prefs = makePrefs({ size: { min: 8, max: 8 } });
  const weight = calculateDynamicWeight("size", prefs);
  // rangeWidth=0, selectivity=1, weight=2*(1+0.5*1)=3.0
  assertEquals(weight, 3.0, "Point range should give max amplification (3.0)");
});

Deno.test("DynWeight E2 - full domain range gives selectivity 0, base weight exactly", () => {
  const prefs = makePrefs({ size: { min: 2, max: 14 } });
  const weight = calculateDynamicWeight("size", prefs);
  // rangeWidth=12, selectivity=0, weight=2.0
  assertEquals(weight, 2.0, "Full domain range should equal base weight");
});

Deno.test("DynWeight E3 - all 4 shine options gives selectivity 0, base weight exactly", () => {
  const prefs = makePrefs({ shineFactor: ["dull", "neutral", "shiny", "extraShiny"] });
  const weight = calculateDynamicWeight("shineFactor", prefs);
  // selectivity=1-(4/4)=0, weight=1.5
  assertEquals(weight, 1.5, "All shine options should equal base weight");
});

Deno.test("DynWeight E4 - dynamic weights preserve mutual symmetry with asymmetric selectivities", () => {
  // A has narrow size, B has wide size - different dynamic weights per side
  const prefsA = makePrefs({ size: { min: 6, max: 7 } }); // narrow
  const attrsA = makeAttrs({ size: 7 });
  const prefsB = makePrefs({ size: { min: 3, max: 12 } }); // wide
  const attrsB = makeAttrs({ size: 7 });

  const forward = mutualScore(prefsA, attrsA, prefsB, attrsB);
  const reverse = mutualScore(prefsB, attrsB, prefsA, attrsA);

  assertEquals(forward.mutual, reverse.mutual, "Mutual score must be symmetric");
  assertEquals(forward.ourScore, reverse.theirScore, "A→B should equal B←A");
  assertEquals(forward.theirScore, reverse.ourScore, "B→A should equal A←B");
});

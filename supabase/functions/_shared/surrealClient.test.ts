/**
 * Tests for Weighted Gradient Scoring Algorithm
 *
 * Run with:
 * deno test --config supabase/functions/_shared/deno.json supabase/functions/_shared/surrealClient.test.ts
 */

import {
  assertEquals,
  assertAlmostEquals,
  assert,
} from "std/assert";

import {
  calculateWeightedGradientScore,
  calculateMatchScore,
  type FruitRecord,
} from "./surrealClient.ts";

// ============================================================================
// Test Helpers
// ============================================================================

function makeAttributes(overrides: Partial<FruitRecord["attributes"]> = {}): FruitRecord["attributes"] {
  return {
    size: 7,
    weight: 180,
    hasStem: true,
    hasLeaf: false,
    hasWorm: false,
    shineFactor: "shiny",
    hasChemicals: false,
    ...overrides,
  };
}

function makePreferences(overrides: Partial<FruitRecord["preferences"]> = {}): FruitRecord["preferences"] {
  return {
    ...overrides,
  };
}

// ============================================================================
// Range Scoring Tests (Exponential Decay)
// ============================================================================

Deno.test("Range scoring - value within range scores 100%", () => {
  const prefs = makePreferences({ size: { min: 5, max: 10 } });
  const attrs = makeAttributes({ size: 7 });

  const result = calculateWeightedGradientScore(prefs, attrs);
  const sizeScore = result.breakdown.find((b) => b.attribute === "size");

  assertEquals(sizeScore?.score, 1.0, "Size within range should score 100%");
});

Deno.test("Range scoring - value at boundary scores 100%", () => {
  const prefs = makePreferences({ size: { min: 5, max: 10 } });

  // Test min boundary
  const attrsMin = makeAttributes({ size: 5 });
  const resultMin = calculateWeightedGradientScore(prefs, attrsMin);
  assertEquals(
    resultMin.breakdown.find((b) => b.attribute === "size")?.score,
    1.0,
    "Size at min boundary should score 100%"
  );

  // Test max boundary
  const attrsMax = makeAttributes({ size: 10 });
  const resultMax = calculateWeightedGradientScore(prefs, attrsMax);
  assertEquals(
    resultMax.breakdown.find((b) => b.attribute === "size")?.score,
    1.0,
    "Size at max boundary should score 100%"
  );
});

Deno.test("Range scoring - exponential decay outside range (size)", () => {
  const prefs = makePreferences({ size: { min: 5, max: 10 } });

  // Size 11 is 1 unit outside, with tolerance 2.0: e^(-1/2) ≈ 0.6065
  const attrs = makeAttributes({ size: 11 });
  const result = calculateWeightedGradientScore(prefs, attrs);
  const sizeScore = result.breakdown.find((b) => b.attribute === "size")?.score ?? 0;

  assertAlmostEquals(sizeScore, Math.exp(-1 / 2), 0.01, "Size 11 (1 outside) should score ~60.6%");
});

Deno.test("Range scoring - exponential decay outside range (weight)", () => {
  const prefs = makePreferences({ weight: { min: 100, max: 200 } });

  // Weight 240 is 40 units outside, with tolerance 40.0: e^(-40/40) = e^(-1) ≈ 0.368
  const attrs = makeAttributes({ weight: 240 });
  const result = calculateWeightedGradientScore(prefs, attrs);
  const weightScore = result.breakdown.find((b) => b.attribute === "weight")?.score ?? 0;

  assertAlmostEquals(weightScore, Math.exp(-1), 0.01, "Weight 240 (40 outside) should score ~36.8%");
});

Deno.test("Range scoring - farther outside scores lower", () => {
  const prefs = makePreferences({ size: { min: 5, max: 10 } });

  const attrs1 = makeAttributes({ size: 11 }); // 1 unit outside
  const attrs2 = makeAttributes({ size: 14 }); // 4 units outside

  const result1 = calculateWeightedGradientScore(prefs, attrs1);
  const result2 = calculateWeightedGradientScore(prefs, attrs2);

  const score1 = result1.breakdown.find((b) => b.attribute === "size")?.score ?? 0;
  const score2 = result2.breakdown.find((b) => b.attribute === "size")?.score ?? 0;

  assert(score1 > score2, `Closer value (${score1}) should score higher than farther (${score2})`);
});

Deno.test("Range scoring - one-sided range (only min)", () => {
  const prefs = makePreferences({ size: { min: 5 } });

  // Value above min should be 100%
  const attrsAbove = makeAttributes({ size: 10 });
  const resultAbove = calculateWeightedGradientScore(prefs, attrsAbove);
  assertEquals(
    resultAbove.breakdown.find((b) => b.attribute === "size")?.score,
    1.0,
    "Size above min-only preference should score 100%"
  );

  // Value below min should decay
  const attrsBelow = makeAttributes({ size: 3 });
  const resultBelow = calculateWeightedGradientScore(prefs, attrsBelow);
  const scoreBelow = resultBelow.breakdown.find((b) => b.attribute === "size")?.score ?? 0;
  assert(scoreBelow < 1.0, "Size below min should score less than 100%");
});

// ============================================================================
// Shine Factor Scoring Tests (Ordinal Gradient)
// ============================================================================

Deno.test("Shine scoring - exact match scores 100%", () => {
  const prefs = makePreferences({ shineFactor: "shiny" });
  const attrs = makeAttributes({ shineFactor: "shiny" });

  const result = calculateWeightedGradientScore(prefs, attrs);
  const shineScore = result.breakdown.find((b) => b.attribute === "shineFactor");

  assertEquals(shineScore?.score, 1.0, "Exact shine match should score 100%");
});

Deno.test("Shine scoring - match in array scores 100%", () => {
  const prefs = makePreferences({ shineFactor: ["shiny", "extraShiny"] });
  const attrs = makeAttributes({ shineFactor: "extraShiny" });

  const result = calculateWeightedGradientScore(prefs, attrs);
  const shineScore = result.breakdown.find((b) => b.attribute === "shineFactor");

  assertEquals(shineScore?.score, 1.0, "Match in array should score 100%");
});

Deno.test("Shine scoring - ordinal gradient (1 step away = 67%)", () => {
  // Ordinal: dull(0) -> neutral(1) -> shiny(2) -> extraShiny(3)
  const prefs = makePreferences({ shineFactor: "shiny" }); // ordinal 2
  const attrs = makeAttributes({ shineFactor: "neutral" }); // ordinal 1, distance = 1

  const result = calculateWeightedGradientScore(prefs, attrs);
  const shineScore = result.breakdown.find((b) => b.attribute === "shineFactor")?.score ?? 0;

  // Score = 1 - (1/3) = 0.6667
  assertAlmostEquals(shineScore, 1 - 1 / 3, 0.01, "1 step away should score ~67%");
});

Deno.test("Shine scoring - ordinal gradient (2 steps away = 33%)", () => {
  const prefs = makePreferences({ shineFactor: "extraShiny" }); // ordinal 3
  const attrs = makeAttributes({ shineFactor: "neutral" }); // ordinal 1, distance = 2

  const result = calculateWeightedGradientScore(prefs, attrs);
  const shineScore = result.breakdown.find((b) => b.attribute === "shineFactor")?.score ?? 0;

  // Score = 1 - (2/3) = 0.3333
  assertAlmostEquals(shineScore, 1 - 2 / 3, 0.01, "2 steps away should score ~33%");
});

Deno.test("Shine scoring - ordinal gradient (3 steps away = 0%)", () => {
  const prefs = makePreferences({ shineFactor: "extraShiny" }); // ordinal 3
  const attrs = makeAttributes({ shineFactor: "dull" }); // ordinal 0, distance = 3

  const result = calculateWeightedGradientScore(prefs, attrs);
  const shineScore = result.breakdown.find((b) => b.attribute === "shineFactor")?.score ?? 0;

  // Score = 1 - (3/3) = 0
  assertEquals(shineScore, 0, "Max distance (3 steps) should score 0%");
});

Deno.test("Shine scoring - picks closest in array", () => {
  const prefs = makePreferences({ shineFactor: ["dull", "extraShiny"] }); // ordinals 0 and 3
  const attrs = makeAttributes({ shineFactor: "neutral" }); // ordinal 1

  const result = calculateWeightedGradientScore(prefs, attrs);
  const shineScore = result.breakdown.find((b) => b.attribute === "shineFactor")?.score ?? 0;

  // Distance to dull = 1, distance to extraShiny = 2, min = 1
  // Score = 1 - (1/3) = 0.6667
  assertAlmostEquals(shineScore, 1 - 1 / 3, 0.01, "Should use closest ordinal distance");
});

// ============================================================================
// Boolean Scoring Tests
// ============================================================================

Deno.test("Boolean scoring - match scores 100%", () => {
  const prefs = makePreferences({ hasWorm: false });
  const attrs = makeAttributes({ hasWorm: false });

  const result = calculateWeightedGradientScore(prefs, attrs);
  const wormScore = result.breakdown.find((b) => b.attribute === "hasWorm");

  assertEquals(wormScore?.score, 1.0, "Boolean match should score 100%");
});

Deno.test("Boolean scoring - mismatch scores 0%", () => {
  const prefs = makePreferences({ hasWorm: false });
  const attrs = makeAttributes({ hasWorm: true });

  const result = calculateWeightedGradientScore(prefs, attrs);
  const wormScore = result.breakdown.find((b) => b.attribute === "hasWorm");

  assertEquals(wormScore?.score, 0.0, "Boolean mismatch should score 0%");
});

// ============================================================================
// Null/Unknown Attribute Tests
// ============================================================================

Deno.test("Null handling - null attribute scores 50%", () => {
  const prefs = makePreferences({ size: { min: 5, max: 10 } });
  const attrs = makeAttributes({ size: null });

  const result = calculateWeightedGradientScore(prefs, attrs);
  const sizeScore = result.breakdown.find((b) => b.attribute === "size");

  assertEquals(sizeScore?.score, 0.5, "Null attribute should score 50% (uncertainty)");
});

Deno.test("Null handling - all null attributes score 50%", () => {
  const prefs = makePreferences({
    size: { min: 5, max: 10 },
    weight: { min: 100, max: 200 },
    hasWorm: false,
    shineFactor: "shiny",
  });
  const attrs = makeAttributes({
    size: null,
    weight: null,
    hasWorm: null,
    shineFactor: null,
  });

  const result = calculateWeightedGradientScore(prefs, attrs);

  for (const item of result.breakdown) {
    assertEquals(item.score, 0.5, `${item.attribute} should score 50% when null`);
  }

  assertEquals(result.score, 50, "Overall score should be 50% when all null");
});

// ============================================================================
// Weight Application Tests
// ============================================================================

Deno.test("Weights - hasWorm mismatch heavily penalizes total", () => {
  // All perfect except worm mismatch
  const prefsWithWorm = makePreferences({
    size: { min: 5, max: 10 },
    hasWorm: false,
  });
  const attrsWithWorm = makeAttributes({ size: 7, hasWorm: true });

  // All perfect including no worm
  const prefsNoWorm = makePreferences({
    size: { min: 5, max: 10 },
    hasWorm: false,
  });
  const attrsNoWorm = makeAttributes({ size: 7, hasWorm: false });

  const resultWithWorm = calculateWeightedGradientScore(prefsWithWorm, attrsWithWorm);
  const resultNoWorm = calculateWeightedGradientScore(prefsNoWorm, attrsNoWorm);

  // Worm has weight 5.0, size has weight 2.0
  // With worm mismatch: (2.0*1.0 + 5.0*0.0) / (2.0 + 5.0) = 2/7 = 28.6%
  // Without mismatch: (2.0*1.0 + 5.0*1.0) / (2.0 + 5.0) = 7/7 = 100%

  assertEquals(resultNoWorm.score, 100, "Perfect match should be 100%");
  assertAlmostEquals(resultWithWorm.score, 29, 1, "Worm mismatch should heavily penalize (~29%)");
});

Deno.test("Weights - low-weight mismatch has smaller impact", () => {
  // Mismatch on hasLeaf (weight 0.5)
  const prefsLeaf = makePreferences({
    size: { min: 5, max: 10 },
    hasLeaf: true,
  });
  const attrsNoLeaf = makeAttributes({ size: 7, hasLeaf: false });

  const result = calculateWeightedGradientScore(prefsLeaf, attrsNoLeaf);

  // Dynamic weights: size ~2.583 (narrow range), leaf 0.6 (boolean 1.2x)
  // Score = (2.583*1.0 + 0.6*0.0) / (2.583 + 0.6) ≈ 81%
  assertEquals(result.score, 81, "Low-weight mismatch should have smaller impact (81%)");
});

Deno.test("Weights - breakdown includes correct weight values", () => {
  const prefs = makePreferences({
    hasWorm: false,
    hasChemicals: false,
    hasStem: true,
    hasLeaf: true,
  });
  const attrs = makeAttributes();

  const result = calculateWeightedGradientScore(prefs, attrs);

  const wormWeight = result.breakdown.find((b) => b.attribute === "hasWorm")?.weight;
  const chemWeight = result.breakdown.find((b) => b.attribute === "hasChemicals")?.weight;
  const stemWeight = result.breakdown.find((b) => b.attribute === "hasStem")?.weight;
  const leafWeight = result.breakdown.find((b) => b.attribute === "hasLeaf")?.weight;

  assertAlmostEquals(wormWeight!, 6.0, 0.001, "hasWorm weight should be 6.0 (5.0 × 1.2)");
  assertAlmostEquals(chemWeight!, 3.6, 0.001, "hasChemicals weight should be 3.6 (3.0 × 1.2)");
  assertAlmostEquals(stemWeight!, 1.2, 0.001, "hasStem weight should be 1.2 (1.0 × 1.2)");
  assertAlmostEquals(leafWeight!, 0.6, 0.001, "hasLeaf weight should be 0.6 (0.5 × 1.2)");
});

// ============================================================================
// Empty Preferences Tests
// ============================================================================

Deno.test("Empty preferences - scores 100%", () => {
  const prefs = makePreferences({}); // No preferences
  const attrs = makeAttributes();

  const result = calculateWeightedGradientScore(prefs, attrs);

  assertEquals(result.score, 100, "No preferences should score 100%");
  assertEquals(result.breakdown.length, 0, "Breakdown should be empty");
});

// ============================================================================
// Raw Score vs Weighted Score Tests
// ============================================================================

Deno.test("Raw vs weighted - raw score is unweighted average", () => {
  const prefs = makePreferences({
    hasWorm: false, // weight 5.0
    hasLeaf: true,  // weight 0.5
  });
  // One match, one mismatch
  const attrs = makeAttributes({ hasWorm: false, hasLeaf: false });

  const result = calculateWeightedGradientScore(prefs, attrs);

  // Raw: (1.0 + 0.0) / 2 = 50%
  // Weighted: (5.0*1.0 + 0.5*0.0) / (5.0 + 0.5) = 5/5.5 ≈ 91%
  assertEquals(result.rawScore, 50, "Raw score should be simple average (50%)");
  assertAlmostEquals(result.score, 91, 1, "Weighted score should favor high-weight match (~91%)");
});

// ============================================================================
// Legacy Function Compatibility Tests
// ============================================================================

Deno.test("Legacy calculateMatchScore - returns compatible format", () => {
  const prefs = makePreferences({
    size: { min: 5, max: 10 },
    hasWorm: false,
  });
  const attrs = makeAttributes({ size: 7, hasWorm: false });

  const result = calculateMatchScore(prefs, attrs);

  assert(typeof result.score === "number", "Score should be a number");
  assert(Array.isArray(result.breakdown), "Breakdown should be an array");

  for (const item of result.breakdown) {
    assert("attribute" in item, "Breakdown item should have 'attribute'");
    assert("matched" in item, "Breakdown item should have 'matched'");
    assert("reason" in item, "Breakdown item should have 'reason'");
    assert(typeof item.matched === "boolean", "'matched' should be boolean");
  }
});

Deno.test("Legacy calculateMatchScore - matched reflects score >= 0.5", () => {
  const prefs = makePreferences({
    shineFactor: "extraShiny", // ordinal 3
  });
  // neutral is ordinal 1, distance 2, score = 1-2/3 = 0.33 (< 0.5)
  const attrsNeutral = makeAttributes({ shineFactor: "neutral" });
  // shiny is ordinal 2, distance 1, score = 1-1/3 = 0.67 (>= 0.5)
  const attrsShiny = makeAttributes({ shineFactor: "shiny" });

  const resultNeutral = calculateMatchScore(prefs, attrsNeutral);
  const resultShiny = calculateMatchScore(prefs, attrsShiny);

  const neutralMatched = resultNeutral.breakdown.find((b) => b.attribute === "shineFactor")?.matched;
  const shinyMatched = resultShiny.breakdown.find((b) => b.attribute === "shineFactor")?.matched;

  assertEquals(neutralMatched, false, "Score 33% should be matched=false");
  assertEquals(shinyMatched, true, "Score 67% should be matched=true");
});

// ============================================================================
// Integration Tests - Realistic Scenarios
// ============================================================================

Deno.test("Integration - realistic apple preferences vs orange attributes", () => {
  // Apple wants: medium size, no worm, shiny
  const applePrefs = makePreferences({
    size: { min: 6, max: 9 },
    hasWorm: false,
    shineFactor: ["shiny", "extraShiny"],
  });

  // Perfect orange
  const perfectOrange = makeAttributes({
    size: 7,
    hasWorm: false,
    shineFactor: "shiny",
  });
  const perfectResult = calculateWeightedGradientScore(applePrefs, perfectOrange);
  assertEquals(perfectResult.score, 100, "Perfect match should be 100%");

  // Good orange (size slightly off)
  const goodOrange = makeAttributes({
    size: 10, // 1 outside range
    hasWorm: false,
    shineFactor: "shiny",
  });
  const goodResult = calculateWeightedGradientScore(applePrefs, goodOrange);
  assert(goodResult.score > 80 && goodResult.score < 100, `Good match should be 80-100% (got ${goodResult.score})`);

  // Bad orange (has worm)
  const badOrange = makeAttributes({
    size: 7,
    hasWorm: true,
    shineFactor: "shiny",
  });
  const badResult = calculateWeightedGradientScore(applePrefs, badOrange);
  assert(badResult.score < 50, `Worm should heavily penalize (got ${badResult.score})`);
});

Deno.test("Integration - multiple partial matches combine correctly", () => {
  const prefs = makePreferences({
    size: { min: 5, max: 10 },     // weight 2.0
    weight: { min: 100, max: 200 }, // weight 2.0
    shineFactor: "shiny",           // weight 1.5
    hasWorm: false,                 // weight 5.0
  });

  // All slightly off
  const attrs = makeAttributes({
    size: 11,              // ~60.6% (1 outside)
    weight: 240,           // ~36.8% (40 outside)
    shineFactor: "neutral", // ~66.7% (1 step)
    hasWorm: false,         // 100%
  });

  const result = calculateWeightedGradientScore(prefs, attrs);

  // Manual calculation:
  // size: 2.0 * 0.606 = 1.213
  // weight: 2.0 * 0.368 = 0.736
  // shine: 1.5 * 0.667 = 1.000
  // worm: 5.0 * 1.0 = 5.0
  // total weight: 10.5
  // weighted sum: 7.949
  // score: 7.949 / 10.5 ≈ 75.7%

  assert(result.score >= 74 && result.score <= 78, `Combined score should be ~76% (got ${result.score})`);

  console.log("\n  === Partial Match Breakdown ===");
  for (const item of result.breakdown) {
    console.log(`  ${item.attribute}: ${(item.score * 100).toFixed(1)}% × ${item.weight} = ${item.weightedScore.toFixed(2)}`);
  }
  console.log(`  Total: ${result.score}% (raw: ${result.rawScore}%)`);
});

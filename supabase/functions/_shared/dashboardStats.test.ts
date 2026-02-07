/**
 * Tests for Dashboard Stats Computations
 *
 * Tests the pure data-transform logic used by the dashboard charts:
 * - Match Quality Histogram bucketing
 * - Satisfaction Gap aggregation
 * - Preference Coverage calculation
 * - Dealbreaker Hit Rate calculation
 *
 * Run with:
 * ~/.deno/bin/deno test --allow-env --config supabase/functions/_shared/deno.json supabase/functions/_shared/dashboardStats.test.ts
 */

import { assertEquals, assert } from "std/assert";

// ============================================================================
// Extract pure logic from dashboard components (no React dependency)
// ============================================================================

// --- Match Quality Histogram bucketing logic ---
const BUCKETS = [
  { range: "0-20", min: 0, max: 20 },
  { range: "21-40", min: 21, max: 40 },
  { range: "41-60", min: 41, max: 60 },
  { range: "61-80", min: 61, max: 80 },
  { range: "81-100", min: 81, max: 100 },
];

function bucketScores(scores: number[]) {
  return BUCKETS.map((bucket) => ({
    range: bucket.range,
    count: scores.filter((s) => s >= bucket.min && s <= bucket.max).length,
  }));
}

// --- Satisfaction Gap aggregation logic ---
interface ConvMatch { ourScore: number; theirScore: number }
interface Conv { fruitType: "apple" | "orange"; matches: ConvMatch[] }

function satisfactionGap(history: Conv[]) {
  const byType = {
    apple: { our: 0, their: 0, count: 0 },
    orange: { our: 0, their: 0, count: 0 },
  };
  history.forEach((conv) => {
    conv.matches.forEach((m) => {
      byType[conv.fruitType].our += m.ourScore;
      byType[conv.fruitType].their += m.theirScore;
      byType[conv.fruitType].count++;
    });
  });
  return (["apple", "orange"] as const).map((type) => ({
    type,
    yourScore: byType[type].count ? Math.round(byType[type].our / byType[type].count) : 0,
    theirScore: byType[type].count ? Math.round(byType[type].their / byType[type].count) : 0,
  }));
}

// --- Preference Coverage logic ---
function preferenceCoverage(
  fruits: { preferences: Record<string, unknown> }[],
  prefKeys: string[],
) {
  const total = fruits.length || 1;
  const coverage: Record<string, number> = {};
  for (const key of prefKeys) {
    const count = fruits.filter(
      (f) => f.preferences && f.preferences[key] !== undefined,
    ).length;
    coverage[key] = count / total;
  }
  return coverage;
}

// --- Dealbreaker Hit Rate logic ---
function dealbreakerRates(
  fruits: { preferences: Record<string, unknown> }[],
  booleanAttrs: string[],
) {
  const total = fruits.length || 1;
  const rates: Record<string, number> = {};
  for (const attr of booleanAttrs) {
    const caring = fruits.filter(
      (f) => f.preferences && f.preferences[attr] !== undefined,
    );
    if (caring.length > 0) {
      rates[attr] = caring.length / total;
    }
  }
  return rates;
}

// ============================================================================
// Match Quality Histogram Tests
// ============================================================================

Deno.test("Histogram - empty scores returns all zeros", () => {
  const result = bucketScores([]);
  result.forEach((b) => assertEquals(b.count, 0));
});

Deno.test("Histogram - single score lands in correct bucket", () => {
  const result = bucketScores([75]);
  assertEquals(result.find((b) => b.range === "61-80")?.count, 1);
  assertEquals(result.find((b) => b.range === "81-100")?.count, 0);
});

Deno.test("Histogram - boundary values: 0 goes to 0-20, 100 goes to 81-100", () => {
  const result = bucketScores([0, 100]);
  assertEquals(result.find((b) => b.range === "0-20")?.count, 1);
  assertEquals(result.find((b) => b.range === "81-100")?.count, 1);
});

Deno.test("Histogram - boundary values: 20 goes to 0-20, 21 goes to 21-40", () => {
  const result = bucketScores([20, 21]);
  assertEquals(result.find((b) => b.range === "0-20")?.count, 1);
  assertEquals(result.find((b) => b.range === "21-40")?.count, 1);
});

Deno.test("Histogram - all scores accounted for (no gaps, no duplicates)", () => {
  const scores = [0, 10, 20, 21, 40, 41, 60, 61, 80, 81, 100];
  const result = bucketScores(scores);
  const totalBucketed = result.reduce((sum, b) => sum + b.count, 0);
  assertEquals(totalBucketed, scores.length, "Every score should land in exactly one bucket");
});

Deno.test("Histogram - realistic distribution clusters high", () => {
  const scores = [82, 76, 91, 88, 65, 73, 55, 90, 84, 71];
  const result = bucketScores(scores);

  const highCount = (result.find((b) => b.range === "81-100")?.count ?? 0) +
    (result.find((b) => b.range === "61-80")?.count ?? 0);
  assert(highCount >= 8, `Most scores should be in top two buckets (got ${highCount})`);
});

// ============================================================================
// Satisfaction Gap Tests
// ============================================================================

Deno.test("Satisfaction gap - empty history returns zeros", () => {
  const result = satisfactionGap([]);
  assertEquals(result[0].yourScore, 0);
  assertEquals(result[0].theirScore, 0);
});

Deno.test("Satisfaction gap - single apple conversation", () => {
  const result = satisfactionGap([
    { fruitType: "apple", matches: [{ ourScore: 80, theirScore: 60 }] },
  ]);
  const apple = result.find((r) => r.type === "apple")!;
  assertEquals(apple.yourScore, 80);
  assertEquals(apple.theirScore, 60);
});

Deno.test("Satisfaction gap - averages multiple matches correctly", () => {
  const result = satisfactionGap([
    {
      fruitType: "apple",
      matches: [
        { ourScore: 80, theirScore: 60 },
        { ourScore: 90, theirScore: 70 },
        { ourScore: 70, theirScore: 50 },
      ],
    },
  ]);
  const apple = result.find((r) => r.type === "apple")!;
  assertEquals(apple.yourScore, 80, "(80+90+70)/3 = 80");
  assertEquals(apple.theirScore, 60, "(60+70+50)/3 = 60");
});

Deno.test("Satisfaction gap - separates apple and orange correctly", () => {
  const result = satisfactionGap([
    { fruitType: "apple", matches: [{ ourScore: 90, theirScore: 80 }] },
    { fruitType: "orange", matches: [{ ourScore: 50, theirScore: 40 }] },
  ]);
  const apple = result.find((r) => r.type === "apple")!;
  const orange = result.find((r) => r.type === "orange")!;

  assertEquals(apple.yourScore, 90);
  assertEquals(apple.theirScore, 80);
  assertEquals(orange.yourScore, 50);
  assertEquals(orange.theirScore, 40);
});

Deno.test("Satisfaction gap - multiple conversations accumulate", () => {
  const result = satisfactionGap([
    { fruitType: "apple", matches: [{ ourScore: 100, theirScore: 50 }] },
    { fruitType: "apple", matches: [{ ourScore: 60, theirScore: 90 }] },
  ]);
  const apple = result.find((r) => r.type === "apple")!;
  assertEquals(apple.yourScore, 80, "(100+60)/2 = 80");
  assertEquals(apple.theirScore, 70, "(50+90)/2 = 70");
});

// ============================================================================
// Preference Coverage Tests
// ============================================================================

Deno.test("Coverage - empty pool returns 0 for all", () => {
  const result = preferenceCoverage([], ["size", "hasWorm"]);
  assertEquals(result.size, 0);
  assertEquals(result.hasWorm, 0);
});

Deno.test("Coverage - all fruits have all preferences = 100%", () => {
  const fruits = [
    { preferences: { size: { min: 5, max: 10 }, hasWorm: false } },
    { preferences: { size: { min: 3, max: 8 }, hasWorm: true } },
  ];
  const result = preferenceCoverage(fruits, ["size", "hasWorm"]);
  assertEquals(result.size, 1.0);
  assertEquals(result.hasWorm, 1.0);
});

Deno.test("Coverage - partial coverage", () => {
  const fruits = [
    { preferences: { size: { min: 5, max: 10 } } },
    { preferences: { hasWorm: false } },
    { preferences: { size: { min: 3, max: 8 }, hasWorm: true } },
  ];
  const result = preferenceCoverage(fruits, ["size", "hasWorm"]);
  assertAlmostEquals(result.size, 2 / 3);
  assertAlmostEquals(result.hasWorm, 2 / 3);
});

Deno.test("Coverage - preference set to undefined is not counted", () => {
  const fruits = [
    { preferences: { size: undefined, hasWorm: false } },
  ];
  const result = preferenceCoverage(fruits, ["size", "hasWorm"]);
  assertEquals(result.size, 0, "undefined should not count as having a preference");
  assertEquals(result.hasWorm, 1.0);
});

// ============================================================================
// Dealbreaker Hit Rate Tests
// ============================================================================

Deno.test("Dealbreaker - empty pool returns empty rates", () => {
  const result = dealbreakerRates([], ["hasWorm", "hasChemicals"]);
  assertEquals(Object.keys(result).length, 0);
});

Deno.test("Dealbreaker - all care about worm", () => {
  const fruits = [
    { preferences: { hasWorm: false } },
    { preferences: { hasWorm: false } },
    { preferences: { hasWorm: true } },
  ];
  const result = dealbreakerRates(fruits, ["hasWorm", "hasChemicals"]);
  assertEquals(result.hasWorm, 1.0, "All 3 have worm preference");
  assertEquals(result.hasChemicals, undefined, "Nobody cares about chemicals");
});

Deno.test("Dealbreaker - partial caring", () => {
  const fruits = [
    { preferences: { hasWorm: false, hasChemicals: false } },
    { preferences: { hasWorm: false } },
    { preferences: {} },
    { preferences: {} },
  ];
  const result = dealbreakerRates(fruits, ["hasWorm", "hasChemicals"]);
  assertEquals(result.hasWorm, 0.5, "2 out of 4 care about worm");
  assertEquals(result.hasChemicals, 0.25, "1 out of 4 cares about chemicals");
});

// ============================================================================
// Cross-Validation: Histogram + Satisfaction Gap consistency
// ============================================================================

Deno.test("Cross-validation - histogram and gap use same scores", () => {
  const history: Conv[] = [
    {
      fruitType: "apple",
      matches: [
        { ourScore: 80, theirScore: 70 },
        { ourScore: 60, theirScore: 50 },
      ],
    },
  ];

  // Mutual scores that would go into histogram
  const mutualScores = history.flatMap((c) =>
    c.matches.map((m) => Math.round((m.ourScore + m.theirScore) / 2))
  );
  // (80+70)/2=75, (60+50)/2=55
  assertEquals(mutualScores[0], 75);
  assertEquals(mutualScores[1], 55);

  const buckets = bucketScores(mutualScores);
  assertEquals(buckets.find((b) => b.range === "61-80")?.count, 1, "75 in 61-80");
  assertEquals(buckets.find((b) => b.range === "41-60")?.count, 1, "55 in 41-60");

  // Satisfaction gap should show directional averages
  const gap = satisfactionGap(history);
  const apple = gap.find((r) => r.type === "apple")!;
  assertEquals(apple.yourScore, 70, "(80+60)/2 = 70");
  assertEquals(apple.theirScore, 60, "(70+50)/2 = 60");
});

// Need this import for assertAlmostEquals
import { assertAlmostEquals } from "std/assert";

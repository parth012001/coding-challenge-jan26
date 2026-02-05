/**
 * Shared SurrealDB Client for Edge Functions
 */

import Surreal from "surrealdb";

// Environment variables (set these in Supabase dashboard or .env for local dev)
const SURREAL_URL = Deno.env.get("SURREAL_URL") || "wss://ancient-nebula-06e2vh3dapuftfcj42s0iaboqs.aws-usw2.surreal.cloud/rpc";
const SURREAL_NAMESPACE = Deno.env.get("SURREAL_NAMESPACE") || "production";
const SURREAL_DATABASE = Deno.env.get("SURREAL_DATABASE") || "matchmaking";
const SURREAL_USERNAME = Deno.env.get("SURREAL_USERNAME") || "admin";
const SURREAL_PASSWORD = Deno.env.get("SURREAL_PASSWORD") || "Ish2026##";

// =============================================================================
// WEIGHTED GRADIENT SCORING CONSTANTS
// =============================================================================

// Weights derived from data analysis (higher = more important)
const ATTRIBUTE_WEIGHTS: Record<string, number> = {
  hasWorm: 5.0,       // Dealbreaker (60% reject, 8% have)
  hasChemicals: 3.0,  // Health concern
  size: 2.0,          // Important but flexible
  weight: 2.0,        // Important but flexible
  shineFactor: 1.5,   // Aesthetic
  hasStem: 1.0,       // Minor
  hasLeaf: 0.5,       // Least important
};

// Tolerances for exponential decay (based on data distributions)
const RANGE_TOLERANCES: Record<string, number> = {
  size: 2.0,    // Based on SIZE_STD_DEV
  weight: 40.0, // Based on WEIGHT_STD_DEV
};

// Ordinal positions for shine gradient
const SHINE_ORDINAL: Record<string, number> = {
  dull: 0,
  neutral: 1,
  shiny: 2,
  extraShiny: 3,
};

// Score for null/unknown attributes (uncertainty, not failure)
const UNKNOWN_ATTRIBUTE_SCORE = 0.5;

// =============================================================================
// TYPES
// =============================================================================

export interface FruitRecord {
  id: string;
  attributes: {
    size: number | null;
    weight: number | null;
    hasStem: boolean | null;
    hasLeaf: boolean | null;
    hasWorm: boolean | null;
    shineFactor: "dull" | "neutral" | "shiny" | "extraShiny" | null;
    hasChemicals: boolean | null;
  };
  preferences: {
    size?: { min?: number; max?: number };
    weight?: { min?: number; max?: number };
    hasStem?: boolean;
    hasLeaf?: boolean;
    hasWorm?: boolean;
    shineFactor?: string | string[];
    hasChemicals?: boolean;
  };
  createdAt: string;
}

export interface AttributeScore {
  attribute: string;
  score: number;         // 0.0 to 1.0
  weight: number;
  weightedScore: number;
  reason: string;
}

export interface MatchScoreResult {
  score: number;          // Final weighted (0-100)
  rawScore: number;       // Unweighted (0-100)
  breakdown: AttributeScore[];
  totalWeight: number;
}

export interface MutualMatchResult {
  fruit: FruitRecord;
  score: number;          // Combined mutual score
  ourScore: number;
  theirScore: number;
  ourBreakdown: AttributeScore[];
  theirBreakdown: AttributeScore[];
}

// Legacy interface for backwards compatibility
export interface MatchResult {
  fruit: FruitRecord;
  score: number;
  breakdown: {
    attribute: string;
    matched: boolean;
    reason: string;
  }[];
}

/**
 * Get a connected SurrealDB instance
 */
export async function getDb(): Promise<Surreal> {
  const db = new Surreal();

  await db.connect(SURREAL_URL);
  await db.signin({
    username: SURREAL_USERNAME,
    password: SURREAL_PASSWORD,
  });
  await db.use({
    namespace: SURREAL_NAMESPACE,
    database: SURREAL_DATABASE,
  });

  return db;
}

/**
 * Store a new fruit in the database
 */
export async function storeFruit(
  db: Surreal,
  type: "apple" | "orange",
  attributes: FruitRecord["attributes"],
  preferences: FruitRecord["preferences"]
): Promise<FruitRecord> {
  const result = await db.create(type, {
    attributes,
    preferences,
    createdAt: new Date().toISOString(),
  });

  return (result as unknown as FruitRecord[])[0];
}

/**
 * Get all fruits of a specific type
 */
export async function getFruits(db: Surreal, type: "apple" | "orange"): Promise<FruitRecord[]> {
  const results = await db.select(type);
  return results as unknown as FruitRecord[];
}

// =============================================================================
// SCORING FUNCTIONS
// =============================================================================

/**
 * Calculate range score using exponential decay
 * Within range: 100%, Outside: e^(-distance/tolerance)
 */
function calculateRangeScore(
  value: number,
  min: number | undefined,
  max: number | undefined,
  tolerance: number
): { score: number; reason: string } {
  // If no range specified, perfect match
  if (min === undefined && max === undefined) {
    return { score: 1.0, reason: `Value ${value} (no range specified)` };
  }

  const effectiveMin = min ?? -Infinity;
  const effectiveMax = max ?? Infinity;

  // Within range: 100%
  if (value >= effectiveMin && value <= effectiveMax) {
    return {
      score: 1.0,
      reason: `Value ${value} within range [${min ?? "any"}-${max ?? "any"}]`,
    };
  }

  // Calculate distance outside range
  let distance: number;
  if (value < effectiveMin) {
    distance = effectiveMin - value;
  } else {
    distance = value - effectiveMax;
  }

  // Exponential decay: e^(-distance/tolerance)
  const score = Math.exp(-distance / tolerance);

  return {
    score,
    reason: `Value ${value} outside range [${min ?? "any"}-${max ?? "any"}] (${Math.round(score * 100)}% match)`,
  };
}

/**
 * Calculate shine factor score using ordinal gradient
 * Adjacent values get partial credit based on ordinal distance
 */
function calculateShineScore(
  actualShine: string,
  preferredShines: string[]
): { score: number; reason: string } {
  const actualOrdinal = SHINE_ORDINAL[actualShine];
  if (actualOrdinal === undefined) {
    return { score: UNKNOWN_ATTRIBUTE_SCORE, reason: `Unknown shine value "${actualShine}"` };
  }

  // If exact match, return 100%
  if (preferredShines.includes(actualShine)) {
    return { score: 1.0, reason: `Shine "${actualShine}" matches preference` };
  }

  // Find minimum ordinal distance to any preferred shine
  let minDistance = Infinity;
  for (const pref of preferredShines) {
    const prefOrdinal = SHINE_ORDINAL[pref];
    if (prefOrdinal !== undefined) {
      const distance = Math.abs(actualOrdinal - prefOrdinal);
      minDistance = Math.min(minDistance, distance);
    }
  }

  // Max possible distance is 3 (dull to extraShiny)
  const maxDistance = 3;
  const score = 1 - (minDistance / maxDistance);

  return {
    score,
    reason: `Shine "${actualShine}" is ${minDistance} step(s) from preferred (${Math.round(score * 100)}% match)`,
  };
}

/**
 * Calculate boolean score - exact match or mismatch
 */
function calculateBooleanScore(
  actual: boolean,
  preferred: boolean
): { score: number; reason: string } {
  if (actual === preferred) {
    return { score: 1.0, reason: `Value ${actual} matches preference` };
  }
  return { score: 0.0, reason: `Value ${actual} doesn't match preference (wanted ${preferred})` };
}

/**
 * Calculate weighted gradient score between preferences and attributes
 * Returns a detailed breakdown with scores for each attribute
 */
export function calculateWeightedGradientScore(
  preferences: FruitRecord["preferences"],
  attributes: FruitRecord["attributes"]
): MatchScoreResult {
  const breakdown: AttributeScore[] = [];
  let totalWeight = 0;
  let weightedSum = 0;
  let rawSum = 0;
  let attributeCount = 0;

  // Check size preference
  if (preferences.size !== undefined) {
    const weight = ATTRIBUTE_WEIGHTS.size;
    totalWeight += weight;
    attributeCount++;

    if (attributes.size === null) {
      const score = UNKNOWN_ATTRIBUTE_SCORE;
      breakdown.push({
        attribute: "size",
        score,
        weight,
        weightedScore: score * weight,
        reason: "Size unknown (50% uncertainty score)",
      });
      weightedSum += score * weight;
      rawSum += score;
    } else {
      const { score, reason } = calculateRangeScore(
        attributes.size,
        preferences.size.min,
        preferences.size.max,
        RANGE_TOLERANCES.size
      );
      breakdown.push({
        attribute: "size",
        score,
        weight,
        weightedScore: score * weight,
        reason,
      });
      weightedSum += score * weight;
      rawSum += score;
    }
  }

  // Check weight preference
  if (preferences.weight !== undefined) {
    const weight = ATTRIBUTE_WEIGHTS.weight;
    totalWeight += weight;
    attributeCount++;

    if (attributes.weight === null) {
      const score = UNKNOWN_ATTRIBUTE_SCORE;
      breakdown.push({
        attribute: "weight",
        score,
        weight,
        weightedScore: score * weight,
        reason: "Weight unknown (50% uncertainty score)",
      });
      weightedSum += score * weight;
      rawSum += score;
    } else {
      const { score, reason } = calculateRangeScore(
        attributes.weight,
        preferences.weight.min,
        preferences.weight.max,
        RANGE_TOLERANCES.weight
      );
      breakdown.push({
        attribute: "weight",
        score,
        weight,
        weightedScore: score * weight,
        reason,
      });
      weightedSum += score * weight;
      rawSum += score;
    }
  }

  // Check boolean preferences
  const booleanPrefs: (keyof FruitRecord["preferences"])[] = ["hasStem", "hasLeaf", "hasWorm", "hasChemicals"];
  for (const pref of booleanPrefs) {
    if (preferences[pref] !== undefined) {
      const weight = ATTRIBUTE_WEIGHTS[pref];
      totalWeight += weight;
      attributeCount++;

      const attrValue = attributes[pref as keyof FruitRecord["attributes"]];
      if (attrValue === null) {
        const score = UNKNOWN_ATTRIBUTE_SCORE;
        breakdown.push({
          attribute: pref,
          score,
          weight,
          weightedScore: score * weight,
          reason: `${pref} unknown (50% uncertainty score)`,
        });
        weightedSum += score * weight;
        rawSum += score;
      } else {
        const { score, reason } = calculateBooleanScore(
          attrValue as boolean,
          preferences[pref] as boolean
        );
        breakdown.push({
          attribute: pref,
          score,
          weight,
          weightedScore: score * weight,
          reason: `${pref}: ${reason}`,
        });
        weightedSum += score * weight;
        rawSum += score;
      }
    }
  }

  // Check shine factor preference
  if (preferences.shineFactor !== undefined) {
    const weight = ATTRIBUTE_WEIGHTS.shineFactor;
    totalWeight += weight;
    attributeCount++;

    if (attributes.shineFactor === null) {
      const score = UNKNOWN_ATTRIBUTE_SCORE;
      breakdown.push({
        attribute: "shineFactor",
        score,
        weight,
        weightedScore: score * weight,
        reason: "Shine factor unknown (50% uncertainty score)",
      });
      weightedSum += score * weight;
      rawSum += score;
    } else {
      const acceptableShines = Array.isArray(preferences.shineFactor)
        ? preferences.shineFactor
        : [preferences.shineFactor];
      const { score, reason } = calculateShineScore(attributes.shineFactor, acceptableShines);
      breakdown.push({
        attribute: "shineFactor",
        score,
        weight,
        weightedScore: score * weight,
        reason,
      });
      weightedSum += score * weight;
      rawSum += score;
    }
  }

  // Calculate final scores
  const finalScore = totalWeight === 0 ? 100 : Math.round((weightedSum / totalWeight) * 100);
  const rawScore = attributeCount === 0 ? 100 : Math.round((rawSum / attributeCount) * 100);

  return {
    score: finalScore,
    rawScore,
    breakdown,
    totalWeight,
  };
}

/**
 * Legacy function for backwards compatibility
 * Calculate match score between a fruit's preferences and another fruit's attributes
 * Returns a score from 0-100 and a breakdown of how each preference matched
 */
export function calculateMatchScore(
  preferences: FruitRecord["preferences"],
  attributes: FruitRecord["attributes"]
): { score: number; breakdown: MatchResult["breakdown"] } {
  const result = calculateWeightedGradientScore(preferences, attributes);

  // Convert new breakdown format to legacy format
  const legacyBreakdown: MatchResult["breakdown"] = result.breakdown.map((item) => ({
    attribute: item.attribute,
    matched: item.score >= 0.5,
    reason: item.reason,
  }));

  return { score: result.score, breakdown: legacyBreakdown };
}

/**
 * Find matches for a fruit among the opposite type using weighted gradient scoring
 * Returns matches sorted by mutual score (highest first) with detailed breakdowns
 */
export async function findMatches(
  db: Surreal,
  fruitType: "apple" | "orange",
  fruitPreferences: FruitRecord["preferences"],
  fruitAttributes: FruitRecord["attributes"]
): Promise<MutualMatchResult[]> {
  // Get fruits of the opposite type
  const oppositeType = fruitType === "apple" ? "orange" : "apple";
  const candidates = await getFruits(db, oppositeType);

  // Calculate match scores for each candidate using weighted gradient scoring
  const matches: MutualMatchResult[] = candidates.map((candidate) => {
    // How well does the candidate match our preferences?
    const ourResult = calculateWeightedGradientScore(
      fruitPreferences,
      candidate.attributes
    );

    // How well do we match the candidate's preferences? (mutual matching)
    const theirResult = calculateWeightedGradientScore(
      candidate.preferences,
      fruitAttributes
    );

    // Combined score (average of both directions)
    const mutualScore = Math.round((ourResult.score + theirResult.score) / 2);

    return {
      fruit: candidate,
      score: mutualScore,
      ourScore: ourResult.score,
      theirScore: theirResult.score,
      ourBreakdown: ourResult.breakdown,
      theirBreakdown: theirResult.breakdown,
    };
  });

  // Sort by score (highest first)
  matches.sort((a, b) => b.score - a.score);

  return matches;
}

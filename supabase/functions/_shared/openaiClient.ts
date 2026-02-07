/**
 * Shared OpenAI Client for Edge Functions
 * Provides LLM-powered match explanations with graceful fallback
 */

import OpenAI from "npm:openai@^4.0.0";
import { FruitRecord, AttributeScore } from "./surrealClient.ts";

// Environment variables
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini";

// =============================================================================
// TYPES
// =============================================================================

export interface MatchExplanation {
  matchRank: number;
  matchId: string;
  overallSummary: string;
  whyTheyLikeYou: string;
  whyYouLikeThem: string;
  compatibilityHighlights: string[];
}

export interface LLMMatchResponse {
  introduction: string;
  explanations: MatchExplanation[];
  closingNote: string;
}

export interface LLMErrorResponse {
  error: string;
  fallbackExplanations: {
    matchRank: number;
    matchId: string;
    summary: string;
  }[];
}

interface MatchData {
  id: string;
  score: number;
  ourScore: number;
  theirScore: number;
  attributes: FruitRecord["attributes"];
  preferences: FruitRecord["preferences"];
  breakdown: {
    our: AttributeScore[];
    their: AttributeScore[];
  };
}

interface FruitContext {
  type: "apple" | "orange";
  attributes: FruitRecord["attributes"];
  preferences: FruitRecord["preferences"];
  communication: {
    attributes: string;
    preferences: string;
  };
}

// =============================================================================
// PROMPT ENGINEERING
// =============================================================================

const SYSTEM_PROMPT = `You are a friendly, enthusiastic matchmaker for the "Fruit Match" dating app where fruits find their perfect partner.

Your role is to explain matchmaking results in a fun, personalized way. You should:
1. Reference actual compatibility scores and specific attribute matches
2. Explain BOTH directions of compatibility (why they like each other)
3. Be encouraging but honest about match quality
4. Use fruit-themed language and light humor
5. Keep explanations concise but informative

You MUST respond with valid JSON in this exact structure:
{
  "introduction": "A personalized greeting for the new fruit",
  "explanations": [
    {
      "matchRank": 1,
      "matchId": "the match ID",
      "overallSummary": "A punchy 8-10 word teaser of the match (e.g. 'Great size match, but missing a stem!')",
      "whyTheyLikeYou": "2-3 sentences explaining why the matched fruit likes the new fruit. Reference specific attributes, scores, and preferences they care about.",
      "whyYouLikeThem": "2-3 sentences explaining why the new fruit should like the matched fruit. Reference specific attributes, scores, and what makes them appealing.",
      "compatibilityHighlights": ["highlight1", "highlight2"]
    }
  ],
  "closingNote": "A brief encouraging note"
}`;

function buildUserPrompt(
  newFruit: FruitContext,
  matches: MatchData[]
): string {
  const oppositeType = newFruit.type === "apple" ? "orange" : "apple";

  let prompt = `A new ${newFruit.type} just joined Fruit Match and needs their match results explained!

## About the New ${newFruit.type.charAt(0).toUpperCase() + newFruit.type.slice(1)}

**Self-description:** ${newFruit.communication.attributes}

**What they're looking for:** ${newFruit.communication.preferences}

**Raw attributes:**
${JSON.stringify(newFruit.attributes, null, 2)}

**Preferences:**
${JSON.stringify(newFruit.preferences, null, 2)}

## Their Top ${matches.length} ${oppositeType.charAt(0).toUpperCase() + oppositeType.slice(1)} Matches

`;

  matches.forEach((match, index) => {
    prompt += `### Match #${index + 1}: ${match.id}
- **Overall Score:** ${match.score}% (mutual compatibility)
- **How much they like this ${oppositeType}:** ${match.ourScore}%
- **How much this ${oppositeType} likes them:** ${match.theirScore}%

**${oppositeType.charAt(0).toUpperCase() + oppositeType.slice(1)}'s attributes:**
${JSON.stringify(match.attributes, null, 2)}

**Detailed breakdown - Why the ${newFruit.type} likes this ${oppositeType}:**
${match.breakdown.our.map(b => `- ${b.attribute}: ${b.reason} (${Math.round(b.score * 100)}% match, weight: ${b.weight})`).join('\n')}

**Detailed breakdown - Why this ${oppositeType} likes the ${newFruit.type}:**
${match.breakdown.their.map(b => `- ${b.attribute}: ${b.reason} (${Math.round(b.score * 100)}% match, weight: ${b.weight})`).join('\n')}

`;
  });

  prompt += `Please generate friendly, personalized explanations for these matches. Remember to respond with valid JSON only.`;

  return prompt;
}

// =============================================================================
// FALLBACK LOGIC
// =============================================================================

function generateFallbackResponse(matches: MatchData[]): LLMErrorResponse {
  return {
    error: "LLM unavailable",
    fallbackExplanations: matches.map((match, index) => ({
      matchRank: index + 1,
      matchId: match.id,
      summary: `Match score: ${match.score}% (You: ${match.ourScore}%, They: ${match.theirScore}%)`,
    })),
  };
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Generate LLM-powered explanations for match results
 * Falls back gracefully if OpenAI is unavailable
 */
export async function generateMatchExplanations(
  newFruit: FruitContext,
  matches: MatchData[]
): Promise<LLMMatchResponse | LLMErrorResponse> {
  // Check if API key is configured
  if (!OPENAI_API_KEY) {
    console.warn("OpenAI API key not configured, using fallback");
    return generateFallbackResponse(matches);
  }

  // Return early if no matches
  if (matches.length === 0) {
    return {
      introduction: `Welcome to Fruit Match, little ${newFruit.type}!`,
      explanations: [],
      closingNote: "No matches found yet, but don't worry - more fruits join every day!",
    };
  }

  try {
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(newFruit, matches) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("Empty response from OpenAI");
      return generateFallbackResponse(matches);
    }

    const parsed = JSON.parse(content) as LLMMatchResponse;

    // Validate response structure
    if (!parsed.introduction || !Array.isArray(parsed.explanations)) {
      console.error("Invalid response structure from OpenAI");
      return generateFallbackResponse(matches);
    }

    return parsed;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return generateFallbackResponse(matches);
  }
}

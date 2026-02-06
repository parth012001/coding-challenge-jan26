// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { generateApple, communicateAttributes, communicatePreferences } from "../_shared/generateFruit.ts";
import { getDb, storeFruit, findMatches } from "../_shared/surrealClient.ts";
import { generateMatchExplanations } from "../_shared/openaiClient.ts";

/**
 * Get Incoming Apple Edge Function
 *
 * Task Flow:
 * 1. Generate a new apple instance ✅
 * 2. Capture the new apple's communication (attributes and preferences) ✅
 * 3. Store the new apple in SurrealDB ✅
 * 4. Match the new apple to existing oranges ✅
 * 5. Communicate matching results back to the apple via LLM ✅
 */

// CORS headers for local development
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let db;

  try {
    // Step 1: Generate a new apple instance
    const apple = generateApple();

    // Step 2: Capture the apple's communication
    const appleAttrs = communicateAttributes(apple);
    const applePrefs = communicatePreferences(apple);

    // Step 3: Connect to SurrealDB and store the new apple
    db = await getDb();
    const storedApple = await storeFruit(
      db,
      "apple",
      apple.attributes,
      apple.preferences
    );

    // Step 4: Match the new apple to existing oranges
    const matches = await findMatches(
      db,
      "apple",
      apple.preferences,
      apple.attributes
    );

    // Get top 3 matches with detailed breakdowns
    const topMatches = matches.slice(0, 3).map((match) => ({
      id: match.fruit.id,
      score: match.score,
      ourScore: match.ourScore,
      theirScore: match.theirScore,
      attributes: match.fruit.attributes,
      preferences: match.fruit.preferences,
      breakdown: {
        our: match.ourBreakdown,
        their: match.theirBreakdown,
      },
    }));

    // Step 5: Communicate matching results via LLM
    let llmExplanation = null;
    if (topMatches.length > 0) {
      llmExplanation = await generateMatchExplanations(
        {
          type: "apple",
          attributes: apple.attributes,
          preferences: apple.preferences,
          communication: {
            attributes: appleAttrs,
            preferences: applePrefs,
          },
        },
        topMatches
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        apple: {
          id: storedApple.id,
          attributes: apple.attributes,
          preferences: apple.preferences,
          communication: {
            attributes: appleAttrs,
            preferences: applePrefs,
          },
        },
        matches: topMatches,
        totalCandidates: matches.length,
        llmExplanation,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing incoming apple:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process incoming apple",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  } finally {
    if (db) {
      await db.close();
    }
  }
});

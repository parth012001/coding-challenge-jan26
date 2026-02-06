// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { generateOrange, communicateAttributes, communicatePreferences } from "../_shared/generateFruit.ts";
import { getDb, storeFruit, findMatches } from "../_shared/surrealClient.ts";
import { generateMatchExplanations } from "../_shared/openaiClient.ts";

/**
 * Get Incoming Orange Edge Function
 *
 * Task Flow:
 * 1. Generate a new orange instance ✅
 * 2. Capture the new orange's communication (attributes and preferences) ✅
 * 3. Store the new orange in SurrealDB ✅
 * 4. Match the new orange to existing apples ✅
 * 5. Communicate matching results back to the orange via LLM ✅
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
    // Step 1: Generate a new orange instance
    const orange = generateOrange();

    // Step 2: Capture the orange's communication
    const orangeAttrs = communicateAttributes(orange);
    const orangePrefs = communicatePreferences(orange);

    // Step 3: Connect to SurrealDB and store the new orange
    db = await getDb();
    const storedOrange = await storeFruit(
      db,
      "orange",
      orange.attributes,
      orange.preferences
    );

    // Step 4: Match the new orange to existing apples
    const matches = await findMatches(
      db,
      "orange",
      orange.preferences,
      orange.attributes
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
          type: "orange",
          attributes: orange.attributes,
          preferences: orange.preferences,
          communication: {
            attributes: orangeAttrs,
            preferences: orangePrefs,
          },
        },
        topMatches
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        orange: {
          id: storedOrange.id,
          attributes: orange.attributes,
          preferences: orange.preferences,
          communication: {
            attributes: orangeAttrs,
            preferences: orangePrefs,
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
    console.error("Error processing incoming orange:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process incoming orange",
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

import type { FruitType, EdgeFunctionResponse } from "./types";
import { fetchJsonWithRetry, runEffect } from "./utils";

const SUPABASE_FUNCTIONS_URL =
  process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL || "http://127.0.0.1:54321";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export async function callEdgeFunction(
  fruitType: FruitType,
  signal?: AbortSignal
): Promise<EdgeFunctionResponse> {
  const url = `${SUPABASE_FUNCTIONS_URL}/functions/v1/get-incoming-${fruitType}`;
  return runEffect(
    fetchJsonWithRetry<EdgeFunctionResponse>(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({}),
        signal,
      },
      2
    )
  );
}

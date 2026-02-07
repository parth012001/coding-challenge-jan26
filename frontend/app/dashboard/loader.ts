import type { DashboardData, DashboardMetrics } from "@/lib/types";
import https from "node:https";

const SURREAL_HTTP_URL = process.env.SURREAL_HTTP_URL || "";
const SURREAL_NAMESPACE = process.env.SURREAL_NAMESPACE || "";
const SURREAL_DATABASE = process.env.SURREAL_DATABASE || "";
const SURREAL_USERNAME = process.env.SURREAL_USERNAME || "";
const SURREAL_PASSWORD = process.env.SURREAL_PASSWORD || "";

interface FruitRow {
  id: string;
  preferences: Record<string, unknown>;
}

function surrealQuery<T>(sql: string): Promise<T[]> {
  const auth = Buffer.from(`${SURREAL_USERNAME}:${SURREAL_PASSWORD}`).toString("base64");

  return new Promise((resolve, reject) => {
    const url = new URL(`${SURREAL_HTTP_URL}/sql`);
    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "surreal-ns": SURREAL_NAMESPACE,
          "surreal-db": SURREAL_DATABASE,
          Authorization: `Basic ${auth}`,
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk: Buffer) => (body += chunk.toString()));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`SurrealDB HTTP ${res.statusCode}: ${body}`));
            return;
          }
          try {
            const json = JSON.parse(body);
            const first = Array.isArray(json) ? json[0] : json;
            if (first?.status === "ERR") {
              reject(new Error(first.result));
              return;
            }
            resolve((first?.result ?? []) as T[]);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(sql);
    req.end();
  });
}

export async function getDashboardData(): Promise<DashboardData> {
  const defaults: DashboardMetrics = {
    totalApples: 0,
    totalOranges: 0,
    preferenceCoverage: {},
    dealbreakerRates: {},
  };

  if (!SURREAL_HTTP_URL) {
    console.warn("Missing SURREAL_HTTP_URL — using default dashboard metrics");
    return { metrics: defaults };
  }

  try {
    const [apples, oranges] = await Promise.all([
      surrealQuery<FruitRow>("SELECT id, preferences FROM apple"),
      surrealQuery<FruitRow>("SELECT id, preferences FROM orange"),
    ]);

    const allFruits = [...apples, ...oranges];
    const total = allFruits.length || 1;

    const prefKeys = [
      "size",
      "weight",
      "hasStem",
      "hasLeaf",
      "hasWorm",
      "shineFactor",
      "hasChemicals",
    ];
    const preferenceCoverage: Record<string, number> = {};
    for (const key of prefKeys) {
      const count = allFruits.filter(
        (f) => f.preferences && f.preferences[key] !== undefined
      ).length;
      preferenceCoverage[key] = count / total;
    }

    const booleanAttrs = ["hasWorm", "hasChemicals", "hasStem", "hasLeaf"];
    const dealbreakerRates: Record<string, number> = {};
    for (const attr of booleanAttrs) {
      const caring = allFruits.filter(
        (f) => f.preferences && f.preferences[attr] !== undefined
      );
      if (caring.length > 0) {
        dealbreakerRates[attr] = caring.length / total;
      }
    }

    return {
      metrics: {
        totalApples: apples.length,
        totalOranges: oranges.length,
        preferenceCoverage,
        dealbreakerRates,
      },
    };
  } catch (err) {
    console.error("Dashboard data fetch error:", err);
    return { metrics: defaults };
  }
}

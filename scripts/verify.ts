/**
 * Verify Script - Check if fruits are in SurrealDB
 */

import Surreal from "surrealdb";

const SURREAL_URL = process.env.SURREAL_URL;
const SURREAL_NAMESPACE = process.env.SURREAL_NAMESPACE;
const SURREAL_DATABASE = process.env.SURREAL_DATABASE;
const SURREAL_USERNAME = process.env.SURREAL_USERNAME;
const SURREAL_PASSWORD = process.env.SURREAL_PASSWORD;

if (!SURREAL_URL || !SURREAL_NAMESPACE || !SURREAL_DATABASE || !SURREAL_USERNAME || !SURREAL_PASSWORD) {
  console.error("Missing required environment variables. See .env.example for reference.");
  process.exit(1);
}

async function verify() {
  const db = new Surreal();

  try {
    console.log("📡 Connecting to SurrealDB...");
    await db.connect(SURREAL_URL);

    console.log("🔐 Signing in...");
    await db.signin({
      username: SURREAL_USERNAME,
      password: SURREAL_PASSWORD,
    });

    await db.use({
      namespace: SURREAL_NAMESPACE,
      database: SURREAL_DATABASE,
    });

    console.log("\n🔍 Checking database contents...\n");

    const apples = await db.select("apple");
    const oranges = await db.select("orange");

    console.log(`🍎 Apples in database: ${(apples as any[]).length}`);
    console.log(`🍊 Oranges in database: ${(oranges as any[]).length}`);

    if ((apples as any[]).length > 0) {
      console.log("\n📋 Sample apple:");
      console.log(JSON.stringify((apples as any[])[0], null, 2));
    }

    if ((oranges as any[]).length > 0) {
      console.log("\n📋 Sample orange:");
      console.log(JSON.stringify((oranges as any[])[0], null, 2));
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.close();
  }
}

verify();

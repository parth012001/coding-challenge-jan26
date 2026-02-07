/**
 * Seed Script - Load fruits into SurrealDB
 *
 * Run with: npx ts-node scripts/seed.ts
 * Or with Deno: deno run --allow-net --allow-read --allow-env scripts/seed.ts
 */

import Surreal from "surrealdb";
import * as fs from "fs";
import * as path from "path";

// Load environment variables (set via .env.local or shell)
const SURREAL_URL = process.env.SURREAL_URL;
const SURREAL_NAMESPACE = process.env.SURREAL_NAMESPACE;
const SURREAL_DATABASE = process.env.SURREAL_DATABASE;
const SURREAL_USERNAME = process.env.SURREAL_USERNAME;
const SURREAL_PASSWORD = process.env.SURREAL_PASSWORD;

if (!SURREAL_URL || !SURREAL_NAMESPACE || !SURREAL_DATABASE || !SURREAL_USERNAME || !SURREAL_PASSWORD) {
  console.error("Missing required environment variables. See .env.example for reference.");
  process.exit(1);
}

interface FruitAttributes {
  size: number | null;
  weight: number | null;
  hasStem: boolean | null;
  hasLeaf: boolean | null;
  hasWorm: boolean | null;
  shineFactor: "dull" | "neutral" | "shiny" | "extraShiny" | null;
  hasChemicals: boolean | null;
}

interface NumberRange {
  min?: number;
  max?: number;
}

interface FruitPreferences {
  size?: NumberRange;
  weight?: NumberRange;
  hasStem?: boolean;
  hasLeaf?: boolean;
  hasWorm?: boolean;
  shineFactor?: string | string[];
  hasChemicals?: boolean;
}

interface Fruit {
  type: "apple" | "orange";
  attributes: FruitAttributes;
  preferences: FruitPreferences;
}

async function seed() {
  console.log("🌱 Starting seed process...\n");

  // Initialize SurrealDB client
  const db = new Surreal();

  try {
    // Connect to SurrealDB Cloud
    console.log(`📡 Connecting to SurrealDB at ${SURREAL_URL}...`);
    await db.connect(SURREAL_URL);

    // Sign in
    console.log("🔐 Signing in...");
    await db.signin({
      username: SURREAL_USERNAME,
      password: SURREAL_PASSWORD,
    });

    // Select namespace and database
    console.log(`📂 Using namespace: ${SURREAL_NAMESPACE}, database: ${SURREAL_DATABASE}`);
    await db.use({
      namespace: SURREAL_NAMESPACE,
      database: SURREAL_DATABASE,
    });

    // Load fruit data from JSON file
    const dataPath = path.join(__dirname, "..", "data", "raw_apples_and_oranges.json");
    console.log(`📄 Loading data from ${dataPath}...`);
    const rawData = fs.readFileSync(dataPath, "utf-8");
    const fruits: Fruit[] = JSON.parse(rawData);

    console.log(`🍎🍊 Found ${fruits.length} fruits to seed\n`);

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log("🧹 Clearing existing fruits...");
    await db.query("DELETE apple;");
    await db.query("DELETE orange;");

    // Insert fruits
    let appleCount = 0;
    let orangeCount = 0;

    for (const fruit of fruits) {
      const table = fruit.type; // "apple" or "orange"

      const record = await db.create(table, {
        attributes: fruit.attributes,
        preferences: fruit.preferences,
        createdAt: new Date().toISOString(),
      });

      if (fruit.type === "apple") {
        appleCount++;
      } else {
        orangeCount++;
      }

      console.log(`  ✅ Created ${fruit.type} with ID: ${(record as any)[0]?.id || "unknown"}`);
    }

    console.log("\n" + "=".repeat(50));
    console.log(`🎉 Seed completed successfully!`);
    console.log(`   🍎 Apples: ${appleCount}`);
    console.log(`   🍊 Oranges: ${orangeCount}`);
    console.log(`   📊 Total: ${fruits.length}`);
    console.log("=".repeat(50));

    // Verify the data
    console.log("\n🔍 Verifying data...");
    const apples = await db.select("apple");
    const oranges = await db.select("orange");
    console.log(`   Found ${(apples as any[]).length} apples in database`);
    console.log(`   Found ${(oranges as any[]).length} oranges in database`);

  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await db.close();
    console.log("\n👋 Connection closed");
  }
}

seed();

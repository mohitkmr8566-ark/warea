// scripts/fixCreatedAt.js
// Run with: node scripts/fixCreatedAt.js

import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Service Account
const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

// Init admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function backfillCreatedAt() {
  console.log("🚀 Backfilling createdAt for products...");
  const snap = await db.collection("products").get();
  console.log(`📦 Scanned ${snap.size} products`);

  let updated = 0;
  let skipped = 0;

  for (const d of snap.docs) {
    const data = d.data() || {};
    if (!data.createdAt) {
      await d.ref.update({
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Added createdAt to ${d.id}`);
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`🎯 Done. Updated ${updated}, skipped ${skipped}`);
}

backfillCreatedAt().catch((err) => {
  console.error("❌ Backfill error:", err);
  process.exit(1);
});

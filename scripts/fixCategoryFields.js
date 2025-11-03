// scripts/fixCategoryFields.js

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";

// ✅ Load serviceAccountKey.json manually (Node-safe)
const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccountKey.json", "utf8")
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function fixCategories() {
  const snapshot = await db.collection("products").get();
  console.log(`🔍 Checking ${snapshot.size} products...`);

  let updated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.category) continue;

    const original = data.category;
    const normalized = original.trim().toLowerCase();

    if (normalized !== original) {
      await doc.ref.update({ category: normalized });
      updated++;
      console.log(`✅ Fixed: "${original}" → "${normalized}"`);
    }
  }

  console.log(`\n🎉 Done! Total fixed = ${updated}`);
  process.exit();
}

fixCategories().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});

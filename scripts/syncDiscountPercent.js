// scripts/syncDiscountPercent.js
import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function syncDiscounts() {
  const snapshot = await db.collection("products").get();
  console.log(`📦 Found ${snapshot.size} products`);

  let updatedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const { mrp, price } = data;

    if (!mrp || !price || isNaN(mrp) || isNaN(price) || mrp <= 0) continue;

    const newDiscount = Math.max(0, Math.round(((mrp - price) / mrp) * 100));
    const oldDiscount = data.discountPercent || 0;

    if (newDiscount !== oldDiscount) {
      await db.collection("products").doc(docSnap.id).update({
        discountPercent: newDiscount,
      });
      console.log(`🔁 Updated discount for product ${docSnap.id}: ${oldDiscount}% → ${newDiscount}%`);
      updatedCount++;
    }
  }

  console.log(`🎯 Sync completed. Updated ${updatedCount} products.`);
}

syncDiscounts().catch((err) => {
  console.error("❌ Sync error:", err);
});

// scripts/migrateProductFields.js
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

async function migrateProducts() {
  const snapshot = await db.collection("products").get();
  console.log(`📦 Found ${snapshot.size} products`);

  let migratedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const updates = {};

    // 🖼️ Migrate image fields if needed
    if (data.image_url && !data.images) {
      updates.images = [
        {
          url: data.image_url,
          public_id: data.image_public_id || null,
        },
      ];
    }

    // 💰 Add new product fields if missing
    if (typeof data.mrp === "undefined") {
      updates.mrp = Number(data.price) || 0;
    }

    if (typeof data.discountPercent === "undefined") {
      updates.discountPercent = 0;
    }

    if (typeof data.isActive === "undefined") {
      updates.isActive = true;
    }

    if (typeof data.isFeatured === "undefined") {
      updates.isFeatured = false;
    }

    if (typeof data.stock === "undefined") {
      updates.stock = null;
    }

    // 🧼 Cleanup old image fields
    if (data.image_url || data.image_public_id) {
      updates.image_url = admin.firestore.FieldValue.delete();
      updates.image_public_id = admin.firestore.FieldValue.delete();
    }
    if (data.image) {
      updates.image = admin.firestore.FieldValue.delete();
    }

    if (Object.keys(updates).length > 0) {
      await db.collection("products").doc(docSnap.id).update(updates);
      console.log(`✅ Migrated product: ${docSnap.id}`);
      migratedCount++;
    }
  }

  console.log(`🎯 Migration completed. Updated ${migratedCount} products.`);
}

migrateProducts().catch((err) => {
  console.error("❌ Migration error:", err);
});

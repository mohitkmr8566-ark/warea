// scripts/migrateProductImages.js
import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Helper to resolve relative path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📄 Load the existing service account key
const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

// 🪄 Initialize Firebase Admin with full permissions
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

  for (const d of snapshot.docs) {
    const data = d.data();
    const hasOldImage = data.image_url && !data.images;

    if (hasOldImage) {
      const images = [
        {
          url: data.image_url,
          public_id: data.image_public_id || null,
        },
      ];

      await db.collection("products").doc(d.id).update({ images });
      console.log(`✅ Migrated product: ${d.id}`);
      migratedCount++;
    }
  }

  console.log(`🎯 Migration completed. Migrated ${migratedCount} products.`);
}

migrateProducts().catch((err) => {
  console.error("❌ Migration error:", err);
});

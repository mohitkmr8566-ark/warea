// scripts/cleanupOldProductFields.js
import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 📁 Resolve the path to serviceAccountKey.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");

// 🪄 Load credentials
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

// 🧠 Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function cleanupOldFields() {
  const snapshot = await db.collection("products").get();
  console.log(`📦 Found ${snapshot.size} products`);

  let updatedCount = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updateData = {};

    if ("image_url" in data) updateData.image_url = admin.firestore.FieldValue.delete();
    if ("image_public_id" in data) updateData.image_public_id = admin.firestore.FieldValue.delete();
    if ("folder" in data) updateData.folder = admin.firestore.FieldValue.delete();

    if (Object.keys(updateData).length > 0) {
      await db.collection("products").doc(doc.id).update(updateData);
      console.log(`🧹 Cleaned old fields from: ${doc.id}`);
      updatedCount++;
    }
  }

  console.log(`🎯 Cleanup completed. Updated ${updatedCount} products.`);
}

cleanupOldFields().catch((err) => {
  console.error("❌ Cleanup error:", err);
});

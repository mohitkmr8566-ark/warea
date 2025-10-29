// scripts/cleanupOrderBackups.js
import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔐 Load service account key
const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

// 🪄 Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function cleanupBackups() {
  console.log("🧹 Starting cleanup of items_backup fields...");
  const snapshot = await db.collection("orders").get();
  console.log(`📦 Found ${snapshot.size} orders`);

  let cleanedCount = 0;
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.items_backup) {
      await docSnap.ref.update({
        items_backup: admin.firestore.FieldValue.delete(),
      });
      cleanedCount++;
      console.log(`✅ Cleaned backup from order ${docSnap.id}`);
    }
  }

  console.log(`\n🎯 Cleanup completed. Removed backups from ${cleanedCount} orders.`);
}

cleanupBackups().catch((err) => {
  console.error("❌ Cleanup error:", err);
});

// scripts/rollbackOrderImages.js
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

async function rollbackOrderImages() {
  console.log("⏪ Starting rollback for order item images...");

  const ordersSnapshot = await db.collection("orders").get();
  console.log(`📦 Found ${ordersSnapshot.size} orders`);

  let rolledBackOrders = 0;

  for (const orderDoc of ordersSnapshot.docs) {
    const data = orderDoc.data();

    // Only rollback if backup exists
    if (Array.isArray(data.items_backup) && data.items_backup.length > 0) {
      await orderDoc.ref.update({
        items: data.items_backup,
        items_backup: admin.firestore.FieldValue.delete(),
      });
      rolledBackOrders++;
      console.log(`✅ Rolled back order: ${orderDoc.id}`);
    }
  }

  console.log(`\n🎯 Rollback completed.`);
  console.log(`📝 Orders rolled back: ${rolledBackOrders}`);
}

rollbackOrderImages().catch((err) => {
  console.error("❌ Rollback error:", err);
});

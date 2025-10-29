// scripts/migrateOrderImages.js
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

async function migrateOrderImages() {
  console.log("🚀 Starting migration for old order item images (with auto-backup)...");

  const ordersSnapshot = await db.collection("orders").get();
  console.log(`📦 Found ${ordersSnapshot.size} orders`);

  let totalUpdatedOrders = 0;
  let totalUpdatedItems = 0;
  let totalBackupsCreated = 0;

  for (const orderDoc of ordersSnapshot.docs) {
    const orderData = orderDoc.data();
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) continue;

    // 🧰 Backup original items if not already backed up
    if (!Array.isArray(orderData.items_backup)) {
      await orderDoc.ref.update({ items_backup: orderData.items });
      totalBackupsCreated++;
      console.log(`🪄 Backup created for order ${orderDoc.id}`);
    }

    const updatedItems = [];
    let modified = false;

    for (const item of orderData.items) {
      if (item.image && item.image.trim() !== "") {
        updatedItems.push(item);
        continue;
      }

      try {
        const productSnap = await db.collection("products").doc(item.id).get();
        if (productSnap.exists) {
          const productData = productSnap.data();
          const newImage =
            productData?.images?.[0]?.url ||
            productData?.image_url ||
            productData?.image ||
            "";

          if (newImage) {
            updatedItems.push({ ...item, image: newImage });
            modified = true;
            totalUpdatedItems++;
            console.log(`✅ Fixed image for item '${item.name}' in order ${orderDoc.id}`);
          } else {
            updatedItems.push(item);
          }
        } else {
          updatedItems.push(item);
        }
      } catch (err) {
        console.error(`❌ Error fetching product for item ${item.id}:`, err);
        updatedItems.push(item);
      }
    }

    if (modified) {
      await orderDoc.ref.update({ items: updatedItems });
      totalUpdatedOrders++;
    }
  }

  console.log(`\n🎯 Migration finished`);
  console.log(`📝 Orders updated: ${totalUpdatedOrders}`);
  console.log(`🖼️ Items updated: ${totalUpdatedItems}`);
  console.log(`🪄 Backups created: ${totalBackupsCreated}`);
}

migrateOrderImages().catch((err) => {
  console.error("❌ Migration error:", err);
});

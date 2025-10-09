// scripts/importProductsToFirestore.js
require("dotenv").config({ path: ".env.local" });
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parse/sync");

// Load Firebase service account
const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");

if (!fs.existsSync(serviceAccountPath)) {
  console.error("❌ Service account key not found at:", serviceAccountPath);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function importProducts() {
  try {
    const csvPath = path.resolve(__dirname, "../data/products.csv");
    const fileContent = fs.readFileSync(csvPath, "utf-8");

    // Parse CSV
    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`🟡 Found ${records.length} rows in CSV.`);

    let success = 0;
    let failed = 0;

    for (const row of records) {
      try {
        const docId = row.id || row.title.toLowerCase().replace(/\s+/g, "-");

        const docRef = db.collection("products").doc(docId);
        const productData = {
          title: row.title || "Untitled",
          category: row.category || "Misc",
          price: parseFloat(row.price) || 0,
          featured: row.featured?.toString().toLowerCase() === "true",
          image_url: row.image_url,
          image_public_id: row.image_public_id,
          folder: row.folder || "warea/products",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await docRef.set(productData, { merge: true });
        console.log(`✅ Imported: ${row.title}`);
        success++;
      } catch (err) {
        console.error(`❌ Failed for ${row.title}:`, err.message);
        failed++;
      }
    }

    console.log(`\n✅ Import complete! ${success} succeeded, ${failed} failed.`);
  } catch (err) {
    console.error("❌ Error importing CSV:", err);
  }
}

importProducts();

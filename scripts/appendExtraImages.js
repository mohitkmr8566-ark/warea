// scripts/appendExtraImages.js
// Usage:
//   node scripts/appendExtraImages.js --dry    # see what would change
//   node scripts/appendExtraImages.js          # actually update Firestore

require("dotenv").config();
const slugify = require("slugify");
const { v2: cloudinary } = require("cloudinary");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const DRY_RUN = process.argv.includes("--dry");
const PRODUCTS_FOLDER = process.env.CLOUDINARY_PRODUCTS_FOLDER || "warea/products";

function initFirebaseAdmin() {
  if (admin.apps.length) return admin.app();
  const saPath = process.env.SERVICE_ACCOUNT;
  if (!saPath || !fs.existsSync(saPath)) {
    console.error("SERVICE_ACCOUNT file not found:", saPath);
    process.exit(1);
  }
  const serviceAccount = require(path.resolve(saPath));
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

function initCloudinary() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error("Cloudinary env vars missing");
    process.exit(1);
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function baseFromPublicId(publicId) {
  // publicId might be like "warea/products/butterfly-pendant_mfedkx"
  const leaf = publicId.split("/").pop();                // "butterfly-pendant_mfedkx"
  return leaf.includes("_") ? leaf.split("_")[0] : leaf; // "butterfly-pendant"
}

function slugFromDoc(d) {
  const data = d.data() || {};
  if (Array.isArray(data.images) && data.images[0]?.public_id) {
    return baseFromPublicId(data.images[0].public_id);
  }
  if (data.image_public_id) {
    return baseFromPublicId(data.image_public_id);
  }
  if (d.id && d.id.includes("_")) {
    return d.id.split("_")[0];
  }
  if (data.title) {
    return slugify(data.title, { lower: true, strict: true });
  }
  return null;
}

async function fetchAllWithPrefix(prefix) {
  // Prefer the "resources" API with prefix (fast & simple)
  try {
    const res = await cloudinary.api.resources({
      type: "upload",
      prefix: `${PRODUCTS_FOLDER}/${prefix}`,
      max_results: 500,
    });
    return res.resources || [];
  } catch (err) {
    console.error("Cloudinary fetch error for prefix", prefix, err?.message || err);
    return [];
  }
}

(async function main() {
  initCloudinary();
  initFirebaseAdmin();
  const db = admin.firestore();

  console.log(DRY_RUN ? "DRY RUN: no Firestore updates will be made." : "LIVE RUN: Firestore will be updated.");

  const snap = await db.collection("products").get();
  console.log(`Found ${snap.size} products in Firestore.`);

  let totalAppended = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data() || {};
    const slug = slugFromDoc(docSnap);
    if (!slug) {
      console.warn(`Skipping ${docSnap.id} -> cannot determine slug/prefix`);
      continue;
    }

    const existing = Array.isArray(data.images) ? data.images : [];
    const existingIds = new Set(existing.map((x) => x.public_id).filter(Boolean));

    const cloudImgs = await fetchAllWithPrefix(slug);

    // Map cloud resources -> minimal image objects
    const toAppend = [];
    for (const r of cloudImgs) {
      // r.public_id like "warea/products/butterfly-pendant_mfedkx"
      if (existingIds.has(r.public_id)) continue; // already present
      toAppend.push({
        url: r.secure_url,
        public_id: r.public_id,
      });
    }

    if (!toAppend.length) {
      console.log(`• ${docSnap.id} (${slug}) — nothing new to append.`);
      continue;
    }

    const newImages = [...existing, ...toAppend];

    if (DRY_RUN) {
      console.log(`• ${docSnap.id} (${slug}) — would append ${toAppend.length} image(s).`);
    } else {
      await docSnap.ref.set({ images: newImages }, { merge: true });
      console.log(`• ${docSnap.id} (${slug}) — appended ${toAppend.length} image(s).`);
    }

    totalAppended += toAppend.length;
  }

  console.log(DRY_RUN
    ? `DRY RUN complete. Would append total of ${totalAppended} images.`
    : `Done. Appended total of ${totalAppended} images.`);
  process.exit(0);
})();

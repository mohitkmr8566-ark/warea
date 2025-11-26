// scripts/generateProductSitemap.js (ESM) — env-friendly
import fs from "fs";
import path from "path";
import admin from "firebase-admin";

const SERVICE_ACCOUNT_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const SERVICE_ACCOUNT_JSON = process.env.SERVICE_ACCOUNT_JSON;

let saObj = null;

if (SERVICE_ACCOUNT_JSON) {
  try {
    saObj = JSON.parse(SERVICE_ACCOUNT_JSON);
  } catch (err) {
    console.error("Failed to parse SERVICE_ACCOUNT_JSON:", err);
    process.exit(1);
  }
} else if (SERVICE_ACCOUNT_PATH) {
  try {
    const raw = fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf8");
    saObj = JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read GOOGLE_APPLICATION_CREDENTIALS file:", err.message);
    process.exit(1);
  }
} else {
  console.error("ERROR: Provide service account via SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS path.");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(saObj),
  });
}

const db = admin.firestore();

async function generate() {
  console.log("Fetching products from Firestore...");
  const productsRef = db.collection("products");
  const snapshot = await productsRef.select("title").get();

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://warea.vercel.app").replace(/\/$/, "");
  const urls = [];

  snapshot.forEach((doc) => {
    const id = doc.id;
    // If you use slug instead of doc.id, change below:
    // const slug = doc.data().slug || doc.id;
    // const url = `${baseUrl}/product/${slug}`;
    const url = `${baseUrl}/product/${id}`;
    urls.push({ loc: url });
  });

  if (urls.length === 0) {
    console.log("No products found — sitemap not created.");
    return;
  }

  const now = new Date().toISOString();

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `<url>
  <loc>${u.loc}</loc>
  <lastmod>${now}</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.7</priority>
</url>`
  )
  .join("\n")}
</urlset>`;

  const outPath = path.join(process.cwd(), "public", "sitemap-products.xml");
  fs.writeFileSync(outPath, sitemap, "utf8");
  console.log(`✔ sitemap-products.xml generated (${urls.length} URLs) -> ${outPath}`);
}

generate().catch((err) => {
  console.error("Error generating product sitemap:", err);
  process.exit(1);
});

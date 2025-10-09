// scripts/generateProductsCSV.js
// Robust Cloudinary -> CSV exporter (handles both public_id prefix and Media Library folder)
require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

const cloudName =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
  process.env.CLOUDINARY_CLOUD_NAME;
const apiKey =
  process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY;
const apiSecret =
  process.env.CLOUDINARY_API_SECRET ||
  process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error(
    "Missing Cloudinary config. Ensure .env.local contains CLOUDINARY keys."
  );
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

async function fetchByPrefix(prefix) {
  try {
    const res = await cloudinary.api.resources({
      type: "upload",
      prefix,
      max_results: 500,
    });
    return res.resources || [];
  } catch (err) {
    console.warn("api.resources() error:", err.message || err);
    return [];
  }
}

async function fetchBySearchFolder(folder) {
  try {
    const expression = `folder:${folder}`;
    const res = await cloudinary.search.expression(expression).max_results(500).execute();
    return res.resources || [];
  } catch (err) {
    console.warn("search(expression) error:", err.message || err);
    return [];
  }
}

async function fetchResources(prefix) {
  prefix = (prefix || "").replace(/\/$/, "");
  console.log(`Fetching product images from Cloudinary (prefix: ${prefix}) ...`);

  // 1) try resources with prefix
  let resources = await fetchByPrefix(prefix);
  if (resources.length) {
    console.log(`Found ${resources.length} resources using resources(prefix).`);
    return resources;
  }

  // 2) try search by folder path (Media Library folder)
  console.log("No results for prefix. Trying folder search...");
  resources = await fetchBySearchFolder(prefix);
  if (resources.length) {
    console.log(`Found ${resources.length} resources using search(folder:${prefix}).`);
    return resources;
  }

  // 3) fallback: try last path segment (e.g., 'products')
  const last = prefix.split("/").pop();
  if (last && last !== prefix) {
    console.log(`Trying fallback search by folder name: ${last}`);
    resources = await fetchBySearchFolder(last);
    if (resources.length) {
      console.log(`Found ${resources.length} resources using search(folder:${last}).`);
      return resources;
    }
  }

  // 4) final fallback: list first 500 uploaded resources and filter locally
  console.log("Final fallback: listing first 500 resources and filtering by name/folder...");
  try {
    const all = await cloudinary.api.resources({ type: "upload", max_results: 500 });
    const filtered = (all.resources || []).filter((r) => {
      const folder = r.folder || "";
      const pid = r.public_id || "";
      return folder.includes(last) || pid.includes(last);
    });
    console.log(`Filtered ${filtered.length} resources from top 500.`);
    return filtered;
  } catch (err) {
    console.error("Final fallback failed:", err.message || err);
    return [];
  }
}

function guessCategoryFromName(name) {
  const n = name.toLowerCase();
  if (n.includes("earring")) return "Earrings";
  if (n.includes("bracelet")) return "Bracelets";
  if (n.includes("neck") || n.includes("pendant")) return "Necklaces";
  if (n.includes("gift") || n.includes("box") || n.includes("combo")) return "Gift Boxes";
  return "Misc";
}

function cleanTitleFromPublicId(public_id) {
  let t = public_id.split("/").pop();
  // remove common Cloudinary random suffix added by 'unique_filename'
  t = t.replace(/_[a-z0-9]{5,}$/i, "");
  t = t.replace(/[-_]+/g, " ").trim();
  return t;
}

async function main() {
  const prefixArg = process.argv[2] || "warea/products";
  const resources = await fetchResources(prefixArg);

  if (!resources.length) {
    console.log(`No Cloudinary resources found for prefix '${prefixArg}'.`);
    return;
  }

  const rows = resources.map((r) => {
    const public_id = r.public_id || "";
    const image_url = r.secure_url || r.url || "";
    const folder = r.folder || "";
    const title = cleanTitleFromPublicId(public_id);
    const category = guessCategoryFromName(title);
    const price = Math.floor(Math.random() * 1901) + 199; // 199..2099
    const featured = false;
    return { public_id, title, category, price, featured, image_url, folder };
  });

  const outDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outFile = path.join(outDir, "products.csv");

  const header = "id,title,category,price,featured,image_url,image_public_id,folder\n";
  const csvBody = rows
    .map((r) =>
      [
        `"${r.public_id}"`,
        `"${r.title.replace(/"/g, '""')}"`,
        r.category,
        r.price,
        r.featured ? "true" : "false",
        `"${r.image_url}"`,
        `"${r.public_id}"`,
        `"${r.folder}"`,
      ].join(",")
    )
    .join("\n");

  fs.writeFileSync(outFile, header + csvBody);
  console.log(`✅ Wrote ${rows.length} rows to ${outFile}`);
  console.log("Sample row:", rows[0]);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});

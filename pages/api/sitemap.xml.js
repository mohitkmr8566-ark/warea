import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default async function handler(req, res) {
  const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://warea.vercel.app";

  const products = [];

  try {
    const snap = await getDocs(collection(db, "products"));
    snap.forEach((doc) => {
      products.push({
        id: doc.id,
        updatedAt:
          doc.data()?.updatedAt?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
      });
    });
  } catch (err) {
    console.error("❌ Error building sitemap:", err);
  }

  const staticPages = [
    "",
    "shop",
    "search",
    "about",
    "contact",
    "help",
    "wishlist",
    "cart",
    "login",
    "signup",
    "profile",
  ];

  const urls = [
    ...staticPages.map(
      (page) => `
        <url>
          <loc>${baseUrl}/${page}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>${page === "" ? "1.0" : "0.7"}</priority>
        </url>`
    ),
    ...products.map(
      (p) => `
        <url>
          <loc>${baseUrl}/product/${p.id}</loc>
          <lastmod>${p.updatedAt}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.9</priority>
        </url>`
    ),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls.join("")}
  </urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(sitemap.trim());
  res.end();
}

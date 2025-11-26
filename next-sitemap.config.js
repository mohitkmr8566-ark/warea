// next-sitemap.config.js (ESM)
const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://warea.vercel.app";

/** @type {import('next-sitemap').IConfig} */
export default {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: "weekly",
  priority: 0.7,
  exclude: ["/admin/*", "/api/*"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api", "/api/*"],
      },
    ],
    // include product feed in index (do NOT point to sitemap.xml itself)
    additionalSitemaps: [
      `${SITE_URL.replace(/\/$/, "")}/sitemap-products.xml`,
    ],
  },
};

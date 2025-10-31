/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://warea.vercel.app", // Or https://warea.in when domain active
  generateRobotsTxt: true,
  sitemapSize: 7000,
  changefreq: "weekly",
  priority: 0.7,
  exclude: ["/admin/*", "/api/*"],
  robotsTxtOptions: {
    policies: [
      { userAgent: "*", allow: "/" },
      { userAgent: "*", disallow: ["/admin", "/api"] },
    ],
    additionalSitemaps: [
      "https://warea.vercel.app/sitemap.xml",
    ],
  },
};

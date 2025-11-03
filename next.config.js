// ✅ Use ES module syntax
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  poweredByHeader: false,
  compress: true,

  // ✅ Updated Image Config (Next.js 15 & 16 safe)
  images: {
    // ❌ domains is deprecated, so DO NOT use it
    // ✅ Remote patterns (Cloudinary, etc.)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    // ✅ Prevent Next.js from blocking query string images like ?f_auto,q_auto
    // This ensures `/hero-banner.webp?f_auto,q_auto` doesn't break
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
  },

  eslint: { ignoreDuringBuilds: true },

  async headers() {
    return [
      // ✅ Cache Next.js static assets
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // ✅ Cache for image/fonts/css/js assets
      {
        source:
          "/(.*)\\.(js|css|png|jpg|jpeg|webp|avif|gif|svg|ico|ttf|woff|woff2|eot)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // ✅ No cache for HTML content
      {
        source: "/((?!_next/).*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },

  async rewrites() {
    return [];
  },
};

export default withBundleAnalyzer(nextConfig);

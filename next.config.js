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

  // ✅ Updated Image Configuration (Next.js 15/16 Compatible)
  images: {
    // ❌ Removed deprecated domains array
    // ✅ Allow Cloudinary & remote images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // You can add more domains here if needed
    ],
    // ✅ Allow local images even with query params (important for ?f_auto...)
    localPatterns: [
      {
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  eslint: { ignoreDuringBuilds: true },

  async headers() {
    return [
      // ✅ Cache control for Next.js static files
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // ✅ Cache control for static assets like JS/CSS/Images
      {
        source:
          "/(.*)\\.(js|css|png|jpg|jpeg|webp|avif|gif|svg|ico|ttf|woff|woff2|eot)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // ✅ No caching for HTML pages
      {
        source: "/((?!_next/).*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },

  // ✅ Still empty rewrites (fine for now)
  async rewrites() {
    return [];
  },
};

export default withBundleAnalyzer(nextConfig);

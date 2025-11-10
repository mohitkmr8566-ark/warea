// next.config.js (Converted to CommonJS syntax)

import bundleAnalyzer from "@next/bundle-analyzer";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js"; // ✅ Required correct import

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/**
 * @type {import("next").NextConfig}
 */
const createConfig = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  return withBundleAnalyzer({
    reactStrictMode: true,
    poweredByHeader: false,
    compress: true,
    trailingSlash: false,

    // ✅ Image config - Now correct
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "res.cloudinary.com",
        },
      ],
      // We REMOVED "unoptimized: true" so the optimizer works.
      formats: ["image/avif", "image/webp"],
    },

    eslint: {
      ignoreDuringBuilds: true,
    },

    // ✅ Add caching only in production (not dev)
    async headers() {
      if (isDev) return [];
      return [
        {
          source: "/_next/static/(.*)",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=31536000, immutable",
            },
          ],
        },
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
        {
          source: "/((?!_next/).*)",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=0, must-revalidate",
            },
          ],
        },
      ];
    },

    async rewrites() {
      return [];
    },

    // ✅ Prevents infinite reloads in dev (very important)
    webpack(config, { dev }) {
      if (dev) {
        config.watchOptions = {
          ...config.watchOptions,
          ignored: ["**/public/**", "**/.next/**"],
        };
      }
      return config;
    },
  });
};

export default createConfig;

// ✅ ES module
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  poweredByHeader: false,
  compress: true,

  images: {
    domains: ['res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
  },

  eslint: { ignoreDuringBuilds: true },

  async headers() {
    return [
      // ✅ Long-cache only for versioned Next assets
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // ✅ Long-cache for your static files that change rarely
      {
        source: '/(.*)\\.(js|css|png|jpg|jpeg|webp|avif|gif|svg|ico|ttf|woff|woff2|eot)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // ✅ Short cache for HTML/doc responses (ensure fresh)
      {
        source: '/((?!_next/).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ];
  },

  // ❌ Remove no-op rewrite
  async rewrites() {
    return [];
  },
};

export default withBundleAnalyzer(nextConfig);

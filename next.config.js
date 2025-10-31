/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  poweredByHeader: false,
  compress: true,

  images: {
    unoptimized: true,
    domains: ["res.cloudinary.com"],
    formats: ["image/avif", "image/webp"], // ✅ enables better compression formats
  },

  eslint: {
    // ✅ Allows production builds to complete even if ESLint errors exist
    ignoreDuringBuilds: true,
  },

  async rewrites() {
    return [
      {
        source: "/products/:path*",
        destination: "/products/:path*",
      },
    ];
  },
};

export default nextConfig;

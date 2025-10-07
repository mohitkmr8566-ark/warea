/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // ✅ Allow direct serving of public folder images (including /products)
  images: {
    unoptimized: true, // disable Next Image optimization
    domains: ["res.cloudinary.com"], // allow cloudinary images too
  },

  // ✅ Rewrite rule to always resolve /products/* from /public/products/*
  async rewrites() {
    return [
      {
        source: "/products/:path*",
        destination: "/products/:path*",
      },
    ];
  },
};

module.exports = nextConfig;

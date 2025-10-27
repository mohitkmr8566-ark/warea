/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    unoptimized: true,
    domains: ["res.cloudinary.com"],
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

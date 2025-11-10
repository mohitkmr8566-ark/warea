// ✅ FIXED pages/404.js
import Head from "next/head";
import Link from "next/link";

export default function Custom404() {
  // ✅ Use fallback only on client to avoid SSR mismatch
  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_BASE_URL || "";

  return (
    <>
      <Head>
        <title>Page Not Found | Warea Creations</title>
        <meta
          name="description"
          content="This page doesn’t exist. Go back to Warea and continue exploring timeless jewellery."
        />
        {/* ❌ Removed canonical for 404 (Google best practice) */}
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-white">
        <h1 className="text-6xl sm:text-7xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-6 max-w-md">
          Oops! The page you’re looking for doesn’t exist or may have been moved.
        </p>
        <Link
          href="/"
          className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition"
        >
          ⟵ Back to Home
        </Link>
      </div>
    </>
  );
}

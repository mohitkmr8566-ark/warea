// ✅ FIXED pages/500.js
import Head from "next/head";
import Link from "next/link";

export default function Custom500() {
  return (
    <>
      <Head>
        <title>Server Error | Warea Creations</title>
        <meta
          name="description"
          content="We’re experiencing an issue. Please try again later."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-white">
        <h1 className="text-5xl sm:text-6xl font-bold mb-4 text-gray-900">500</h1>
        <p className="text-gray-600 mb-6 max-w-md">
          Something went wrong on our server. Please refresh the page or try again in a few minutes.
        </p>
        <Link
          href="/"
          className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition"
        >
          ⟵ Go to Home
        </Link>
      </div>
    </>
  );
}

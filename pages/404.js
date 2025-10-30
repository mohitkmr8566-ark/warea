import Head from "next/head";
import Link from "next/link";

export default function Custom404() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://warea.in";
  return (
    <>
      <Head>
        <title>Page Not Found | Warea Creations</title>
        <meta name="description" content="This page doesn’t exist. Go back to Warea’s homepage and continue exploring elegant jewellery." />
        <link rel="canonical" href={`${baseUrl}/404`} />
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-gray-600 mb-6">Oops! The page you’re looking for doesn’t exist.</p>
        <Link href="/" className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800">
          Back to Home
        </Link>
      </div>
    </>
  );
}

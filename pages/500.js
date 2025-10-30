import Head from "next/head";
export default function Custom500() {
  return (
    <>
      <Head>
        <title>Server Error | Warea Creations</title>
        <meta name="description" content="We’re experiencing an issue. Please try again later." />
      </Head>
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
        <h1 className="text-5xl font-bold mb-4">500</h1>
        <p className="text-gray-600 mb-6">Something went wrong. Please refresh or come back soon.</p>
      </div>
    </>
  );
}

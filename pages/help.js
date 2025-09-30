import Head from "next/head";

export default function HelpPage() {
  return (
    <>
      <Head>
        <title>Help — Warea</title>
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Help & FAQ</h1>

        <section className="bg-white p-4 rounded-lg shadow mb-4">
          <h3 className="font-medium mb-2">Shipping</h3>
          <p className="text-sm text-gray-600">
            We ship across India. Shipping cost and time will be shown at
            checkout.
          </p>
        </section>

        <section className="bg-white p-4 rounded-lg shadow mb-4">
          <h3 className="font-medium mb-2">Returns & Exchanges</h3>
          <p className="text-sm text-gray-600">
            Return & exchange policy will be available here. Placeholder content
            for now.
          </p>
        </section>

        <section className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-medium mb-2">Contact Support</h3>
          <p className="text-sm text-gray-600">
            Email us at <strong>support@warea.example</strong> (replace with
            real address later).
          </p>
        </section>
      </main>
    </>
  );
}

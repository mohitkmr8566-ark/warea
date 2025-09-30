import Head from "next/head";

export default function ProfilePage() {
  return (
    <>
      <Head>
        <title>Profile — Warea</title>
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Your Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <aside className="md:col-span-1 bg-white p-4 rounded-lg shadow">
            <h2 className="font-medium mb-2">Account</h2>
            <div className="text-sm text-gray-700">
              <p>
                Name: <strong>Guest User</strong>
              </p>
              <p className="mt-1">
                Email: <strong>guest@warea.local</strong>
              </p>
            </div>
          </aside>

          <section className="md:col-span-2 space-y-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Orders</h3>
              <p className="text-sm text-gray-500">
                No orders yet. Orders will appear here once you complete a
                checkout.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-medium mb-2">Addresses</h3>
              <p className="text-sm text-gray-500">
                Add an address to speed up checkout.
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

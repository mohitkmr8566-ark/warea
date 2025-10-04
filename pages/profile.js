import Head from "next/head";
import { useAuth } from "@/store/AuthContext";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <>
      <Head><title>Profile — Warea</title></Head>
      <main className="page-container py-10">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

        {!user ? (
          <div className="text-center py-20">
            <p className="text-lg mb-4">You are not logged in.</p>
            <a href="/login" className="btn btn-primary">Login</a>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <aside className="md:col-span-1 bg-white p-4 rounded-lg shadow">
              <h2 className="font-medium mb-2">Account Info</h2>
              <div className="text-sm text-gray-700">
                <p>Email: <strong>{user.email}</strong></p>
              </div>
              <button className="mt-4 btn btn-ghost" onClick={logout}>
                Logout
              </button>
            </aside>

            <section className="md:col-span-2 space-y-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium mb-2">Orders</h3>
                <p className="text-sm text-gray-500">
                  No orders yet — this will show past orders after checkout.
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
        )}
      </main>
    </>
  );
}

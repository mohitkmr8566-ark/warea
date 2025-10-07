// pages/profile.js
import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/store/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

export default function ProfilePage() {
  const { user, logout, login, signup, googleLogin } = useAuth();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    // only run when user is available
    if (!user?.email) return;
    setLoadingOrders(true);

    // IMPORTANT: query by userId because checkout saves userId: user?.email
    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.email),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setOrders(data);
        setLoadingOrders(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    await login(form.email, form.password);
    setForm({ email: "", name: "", password: "" });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    await signup(form.email, form.password, form.name);
    setForm({ email: "", name: "", password: "" });
  };

  return (
    <>
      <Head>
        <title>Profile — Warea</title>
      </Head>

      <main className="page-container py-10">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Profile</h1>

        {!user ? (
          <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow">
            <div className="flex gap-4 mb-6 justify-center">
              <button
                className={`px-4 py-2 rounded ${
                  tab === "login" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => setTab("login")}
              >
                Login
              </button>
              <button
                className={`px-4 py-2 rounded ${
                  tab === "signup" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => setTab("signup")}
              >
                Sign up
              </button>
            </div>

            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                  className="w-full border px-3 py-2 rounded"
                />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                  className="w-full border px-3 py-2 rounded"
                />
                <button
                  type="submit"
                  className="btn btn-primary w-full mt-2 bg-gray-900 text-white py-2 rounded hover:bg-gray-700"
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => googleLogin()}
                  className="btn btn-ghost w-full mt-3 border flex items-center justify-center gap-2 py-2 rounded hover:bg-gray-100"
                >
                  <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
                  Continue with Google
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  className="w-full border px-3 py-2 rounded"
                />
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                  className="w-full border px-3 py-2 rounded"
                />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                  className="w-full border px-3 py-2 rounded"
                />
                <button
                  type="submit"
                  className="btn btn-primary w-full mt-2 bg-gray-900 text-white py-2 rounded hover:bg-gray-700"
                >
                  Create account
                </button>

                <button
                  type="button"
                  onClick={() => googleLogin()}
                  className="btn btn-ghost w-full mt-3 border flex items-center justify-center gap-2 py-2 rounded hover:bg-gray-100"
                >
                  <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
                  Continue with Google
                </button>
              </form>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <aside className="md:col-span-1 bg-white p-4 rounded-lg shadow">
              <h2 className="font-medium mb-2">Account</h2>
              <div className="text-sm text-gray-700">
                <p>
                  Name: <strong>{user.name}</strong>
                </p>
                <p className="mt-1">
                  Email: <strong>{user.email}</strong>
                </p>
              </div>
              <button
                className="mt-4 btn btn-ghost bg-gray-100 w-full py-2 rounded hover:bg-gray-200"
                onClick={() => logout()}
              >
                Logout
              </button>
            </aside>

            <section className="md:col-span-2 space-y-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium mb-2">My Orders</h3>

                {loadingOrders ? (
                  <p className="text-gray-500">Loading orders...</p>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No orders yet — once you checkout, they’ll appear here.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() =>
                            setExpandedOrder(expandedOrder === order.id ? null : order.id)
                          }
                        >
                          <div>
                            <p className="font-semibold text-sm">
                              <Link
                                href={`/order/${order.id}`}
                                className="text-blue-600 hover:underline"
                              >
                                Order #{order.id.slice(0, 6)}
                              </Link>
                            </p>
                            <p className="text-xs text-gray-500">
                              {order.createdAt?.toDate &&
                                order.createdAt.toDate().toLocaleString(undefined, {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-medium ${order.status === "Pending" ? "text-yellow-600" : "text-green-600"}`}>
                              {order.status || "Processing"}
                            </p>
                            <p className="text-sm font-semibold">₹{order.total}</p>
                          </div>
                        </div>

                        {expandedOrder === order.id && (
                          <div className="mt-4 border-t pt-3 text-sm space-y-2">
                            <div>
                              <h4 className="font-semibold mb-1">Items:</h4>
                              {order.items?.map((item, i) => (
                                <p key={i} className="text-gray-600">
                                  {item.name} × {item.qty} — ₹{item.price * item.qty}
                                </p>
                              ))}
                            </div>
                            <div className="pt-2">
                              <h4 className="font-semibold mb-1">Shipping Address:</h4>
                              <p className="text-gray-600">
                                {order.customer?.name}, {order.customer?.address}, {order.customer?.city}, {order.customer?.state} - {order.customer?.pincode}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium mb-2">Addresses</h3>
                <p className="text-sm text-gray-500">Add an address to speed up checkout.</p>
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  );
}

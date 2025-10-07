// pages/admin/orders.js
import AdminLayout from "@/components/admin/AdminLayout";
import Head from "next/head";
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/store/AuthContext";

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const ADMIN_EMAIL = "mohitkmr8566@gmail.com"; // 🔒 Only admin access

  useEffect(() => {
    if (!user?.email || user.email !== ADMIN_EMAIL) return;

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // 🔄 Update order status
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const ref = doc(db, "orders", orderId);
      await updateDoc(ref, { status: newStatus });
      console.log("✅ Status updated:", newStatus);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  if (!user)
    return (
      <div className="text-center py-20 text-gray-600">
        Please log in as admin to view this page.
      </div>
    );

  if (user.email !== ADMIN_EMAIL)
    return (
      <div className="text-center py-20 text-red-600 font-medium">
        ❌ Access Denied — Admins Only
      </div>
    );

  return (
    <AdminLayout>
      <Head>
        <title>Admin Orders — Warea</title>
      </Head>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Admin Panel — Orders</h1>

        {loading ? (
          <p className="text-gray-500">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-gray-500">No orders found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-md">
              <thead className="bg-gray-100 text-gray-800">
                <tr>
                  <th className="py-3 px-4 text-left">Order ID</th>
                  <th className="py-3 px-4 text-left">Customer</th>
                  <th className="py-3 px-4 text-left">Total</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t text-sm hover:bg-gray-50">
                    <td className="py-3 px-4 font-mono">#{o.id.slice(0, 6)}</td>
                    <td className="py-3 px-4">
                      {o.customer?.name || "—"}
                      <p className="text-xs text-gray-500">{o.userId}</p>
                    </td>
                    <td className="py-3 px-4 font-medium">₹{o.total}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          o.status === "Pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : o.status === "Processing"
                            ? "bg-blue-100 text-blue-700"
                            : o.status === "Shipped"
                            ? "bg-indigo-100 text-indigo-700"
                            : o.status === "Out for Delivery"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {o.createdAt?.toDate &&
                        o.createdAt
                          .toDate()
                          .toLocaleString(undefined, { dateStyle: "medium" })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        <option>Pending</option>
                        <option>Processing</option>
                        <option>Shipped</option>
                        <option>Out for Delivery</option>
                        <option>Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AdminLayout>
  );
}

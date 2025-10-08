// pages/admin/orders.js
import AdminLayout from "@/components/admin/AdminLayout";
import Head from "next/head";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/store/AuthContext";
import { isAdmin } from "@/lib/admin";
import toast from "react-hot-toast";

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({}); // track which rows are expanded

  useEffect(() => {
    if (!user?.email || !isAdmin(user)) return;

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Orders onSnapshot error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  // 🔄 Update order status with audit tracking
  const handleStatusChange = async (orderId, newStatus) => {
    if (!isAdmin(user)) return toast.error("Unauthorized");

    try {
      const order = orders.find((o) => o.id === orderId);
      const oldStatus = order?.status || null;
      if (oldStatus === newStatus) return toast("Status unchanged");

      const ref = doc(db, "orders", orderId);
      const changedAt = new Date().toISOString();

      await updateDoc(ref, {
        status: newStatus,
        statusHistory: arrayUnion({
          oldStatus,
          newStatus,
          changedBy: user?.email || "unknown",
          changedAt,
        }),
      });

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: newStatus,
                statusHistory: [
                  ...(o.statusHistory || []),
                  { oldStatus, newStatus, changedBy: user.email, changedAt },
                ],
              }
            : o
        )
      );

      toast.success("Order status updated ✅");
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Could not update status");
    }
  };

  if (!user || !isAdmin(user))
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
                  <>
                    <tr
                      key={o.id}
                      className="border-t text-sm hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [o.id]: !prev[o.id],
                        }))
                      }
                    >
                      {/* 🔗 CLICKABLE ORDER ID */}
                      <td className="py-3 px-4 font-mono">
                        <a
                          href={`/admin/orders/${o.id}`}
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()} // stop expand toggle
                        >
                          #{o.id?.slice(0, 6)}
                        </a>
                      </td>

                      <td className="py-3 px-4">
                        {o.customer?.name || "—"}
                        <p className="text-xs text-gray-500">{o.userId}</p>
                      </td>
                      <td className="py-3 px-4 font-medium">₹{o.total ?? "0"}</td>
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
                          {o.status || "Pending"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {o.createdAt?.toDate
                          ? o.createdAt
                              .toDate()
                              .toLocaleString(undefined, { dateStyle: "medium" })
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <select
                          value={o.status || "Pending"}
                          onChange={(e) =>
                            handleStatusChange(o.id, e.target.value)
                          }
                          className="border rounded px-2 py-1 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option>Pending</option>
                          <option>Processing</option>
                          <option>Shipped</option>
                          <option>Out for Delivery</option>
                          <option>Delivered</option>
                        </select>
                      </td>
                    </tr>

                    {/* 🔽 Expandable Status History */}
                    {expanded[o.id] && (
                      <tr className="bg-gray-50 text-xs border-t border-gray-200">
                        <td colSpan="6" className="p-3">
                          <div className="font-semibold mb-1">
                            Status History:
                          </div>
                          {(o.statusHistory || []).length > 0 ? (
                            <ul className="space-y-1">
                              {[...o.statusHistory]
                                .sort(
                                  (a, b) =>
                                    new Date(b.changedAt) -
                                    new Date(a.changedAt)
                                )
                                .map((h, i) => (
                                  <li key={i} className="flex justify-between">
                                    <span>
                                      <b>{h.oldStatus}</b> →{" "}
                                      <b>{h.newStatus}</b>
                                    </span>
                                    <span>
                                      {new Date(h.changedAt).toLocaleString()} •{" "}
                                      <i>{h.changedBy}</i>
                                    </span>
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500 italic">
                              No status changes yet.
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </AdminLayout>
  );
}

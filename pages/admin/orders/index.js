// pages/admin/orders/index.js
"use client";

import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useAuth } from "@/store/AuthContext";
import { isAdmin } from "@/lib/admin";
import AdminLayout from "@/components/admin/AdminLayout";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import toast from "react-hot-toast";

/* ---------------- Small helpers ---------------- */
const STATUS_OPTIONS = ["All", "Pending", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];

function fmtDate(v) {
  try {
    if (!v) return "-";
    const d = typeof v?.toDate === "function" ? v.toDate() : (v instanceof Date ? v : new Date(v));
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "-";
  }
}

function StatusBadge({ status }) {
  const s = (status || "Pending").toLowerCase();
  const styles =
    s === "delivered" ? "bg-green-100 text-green-800" :
    s === "shipped" ? "bg-blue-100 text-blue-800" :
    s === "out for delivery" ? "bg-indigo-100 text-indigo-800" :
    s === "processing" ? "bg-amber-100 text-amber-800" :
    s === "cancelled" ? "bg-red-100 text-red-700" :
    "bg-gray-100 text-gray-700";
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles}`}>{status || "Pending"}</span>;
}

/* ---------------- Page ---------------- */
export default function AdminOrdersListPage() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [q, setQ] = useState("");

  const authedAdmin = !!user && isAdmin(user);

  useEffect(() => {
    if (!authedAdmin) return;
    const qRef = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOrders(rows);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        toast.error("Failed to load orders");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [authedAdmin]);

  const filtered = useMemo(() => {
    let list = [...orders];

    // Filter by status (if not "All")
    if (statusFilter !== "All") {
      const s = statusFilter.toLowerCase();
      list = list.filter((o) => (o.status || "Pending").toLowerCase() === s);
    }

    // Search by orderId, customer name, or email
    const t = q.trim().toLowerCase();
    if (t) {
      list = list.filter((o) => {
        const id = (o.id || "").toLowerCase();
        const name = (o.customer?.name || "").toLowerCase();
        const email = (o.userId || "").toLowerCase();
        return id.includes(t) || name.includes(t) || email.includes(t);
      });
    }

    return list;
  }, [orders, statusFilter, q]);

  if (!user) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <p className="text-gray-600">Please log in to continue.</p>
      </div>
    );
  }

  if (!authedAdmin) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
          <p className="text-gray-600">
            Your account (<span className="font-medium">{user.email}</span>) is not authorized to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Admin · Orders — Warea</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-serif font-bold">Orders</h1>
            <p className="text-gray-500 text-sm">
              Overview of all customer orders. Use filters and search to find specific orders quickly.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/replacements"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50"
            >
              Replacement Requests →
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-3 gap-3 mb-5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by Order ID, name, or email…"
            className="w-full border rounded-lg px-3 py-2"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="text-sm text-gray-500 flex items-center">
            Showing <span className="mx-1 font-medium">{filtered.length}</span> of{" "}
            <span className="mx-1 font-medium">{orders.length}</span> orders
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white border rounded-2xl shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Payment</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="bg-white">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">#{o.id.slice(0, 8)}</span>
                        <span className="text-xs text-gray-500">ID: {o.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[260px]">
                        <div className="font-medium text-gray-900">
                          {o.customer?.name || "—"}
                        </div>
                        <div className="text-xs text-gray-500 truncate" title={o.userId || ""}>
                          {o.userId || ""}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">
                        {(o.payment?.type || o.gateway || "—")}
                      </div>
                      {o.payment?.status && (
                        <div className="text-xs text-gray-500 capitalize">{o.payment.status}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {fmtDate(o.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      ₹{Number(o.total || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded border hover:bg-gray-50"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tips */}
        <div className="mt-6 text-xs text-gray-500">
          <p>• Use the status filter and search to quickly find orders.</p>
          <p>• Click “View Details” to update order status and download invoice.</p>
        </div>
      </div>
    </AdminLayout>
  );
}

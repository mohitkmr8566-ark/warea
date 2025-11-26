// pages/admin/orders/[id].js
"use client";

import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuth } from "@/store/AuthContext";
import InvoiceButton from "@/components/orders/InvoiceButton";
import { db } from "@/lib/firebase";
import { isAdmin } from "@/lib/admin";

import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

/* ---------------------- Helpers ---------------------- */
const STATUS_OPTIONS = [
  "Pending",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const REPLACEMENT_STATES = [
  "requested",
  "approved",
  "in_progress",
  "pickup_scheduled",
  "replacement_shipped",
  "completed",
  "rejected",
];

const labelForReplacement = (s) =>
  ({
    requested: "Requested",
    approved: "Approved",
    in_progress: "In Progress",
    pickup_scheduled: "Pickup Scheduled",
    replacement_shipped: "Replacement Shipped",
    completed: "Completed",
    rejected: "Rejected",
  }[s] || s);

function fmtDate(v) {
  try {
    if (!v) return "-";
    if (typeof v?.toDate === "function") v = v.toDate();
    const d = v instanceof Date ? v : new Date(v);
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "-";
  }
}

/* ---------------------- Page ---------------------- */
export default function AdminOrderDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

    // Production-safe base URL for external links (use NEXT_PUBLIC_BASE_URL on Vercel)
  const baseURL = useMemo(
  () =>
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"),
  []
);

  const [activeTab, setActiveTab] = useState("order"); // 'order' | 'replacements' | 'history'
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // replacements under orders/{id}/replacements
  const [replacements, setReplacements] = useState([]);

  const admin = !!user && isAdmin?.(user);

  useEffect(() => {
    if (!id || !admin) return;

    // Listen to the order
    const ref = doc(db, "orders", id);
    const unsubOrder = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
          setLoading(false);
        } else {
          toast.error("Order not found");
          router.push("/admin/orders");
        }
      },
      (err) => {
        console.error(err);
        toast.error("Failed to load order");
        setLoading(false);
      }
    );

    // Listen to replacements
    const replQ = query(collection(db, "orders", id, "replacements"), orderBy("createdAt", "desc"));
    const unsubRepl = onSnapshot(
      replQ,
      (snap) => {
        setReplacements(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error(err);
        toast.error("Failed to load replacements");
      }
    );

    return () => {
      unsubOrder();
      unsubRepl();
    };
  }, [id, admin, router]);

  // --------- Actions ----------
  const updateOrderStatus = async (newStatus) => {
    if (!order) return;
    if (order.status === "Cancelled") {
      toast("Cannot change status of a cancelled order.");
      return;
    }
    try {
      const ref = doc(db, "orders", order.id);
      const oldStatus = order.status || null;
      if (oldStatus === newStatus) return;

      await updateDoc(ref, {
        status: newStatus,
        statusHistory: arrayUnion({
          oldStatus,
          newStatus,
          changedBy: user?.email || "admin",
          changedAt: new Date().toISOString(),
        }),
      });
      toast.success("Status updated ✅");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status");
    }
  };

  const cancelOrder = async () => {
    if (!order) return;
    if (order.status === "Delivered") {
      toast.error("Delivered orders cannot be cancelled.");
      return;
    }
    if (order.status === "Cancelled") {
      toast("Order is already cancelled.");
      return;
    }
    const confirmed = window.confirm(
      "Are you sure you want to cancel this order?\n\nThis action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const ref = doc(db, "orders", order.id);
      const oldStatus = order.status || null;
      const changedAt = new Date().toISOString();

      await updateDoc(ref, {
        status: "Cancelled",
        statusHistory: arrayUnion({
          oldStatus,
          newStatus: "Cancelled",
          changedBy: user?.email || "admin",
          changedAt,
        }),
        // Optional hints for downstream processes:
        "payment.status": "cancelled",
      });

      toast.success("Order cancelled ❌");
    } catch (e) {
      console.error(e);
      toast.error("Failed to cancel order");
    }
  };

  const setReplacementStatus = async (repId, next) => {
    if (order?.status === "Cancelled") {
      toast("Cannot modify replacements for a cancelled order.");
      return;
    }
    try {
      const ref = doc(db, "orders", id, "replacements", repId);
      await updateDoc(ref, {
        status: next,
        updatedAt: serverTimestamp(),
        history: arrayUnion({
          at: serverTimestamp(),
          by: user?.email || "admin",
          to: next,
        }),
      });
      toast.success(`Replacement → ${labelForReplacement(next)}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update replacement");
    }
  };

  // --------- Derived ----------
  const historyRows = useMemo(() => {
    const h = Array.isArray(order?.statusHistory) ? order.statusHistory : [];
    return [...h].sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));
  }, [order]);

  const isCancelled = (order?.status || "").toLowerCase() === "cancelled";
  const isDelivered = (order?.status || "").toLowerCase() === "delivered";

  if (!user) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <p className="text-gray-600">Please log in to continue.</p>
      </div>
    );
  }
  if (!admin) {
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
        <title>Admin · Order #{(id || "").slice(0, 8)} — Warea</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-serif font-bold">
              Order <span className="text-gray-600">#{(id || "").slice(0, 8)}</span>
            </h1>
            {order && (
              <p className="text-sm text-gray-600">
                Customer: <span className="font-medium">{order.customer?.name || "—"}</span> ·{" "}
                {order.userId || "—"}
              </p>
            )}
          </div>

          {order && (
            <div className="flex items-center gap-2">
              <InvoiceButton orderId={order.id} />{/* server-generated invoice */}
              <a
                href={`${baseURL}/api/invoice/${order.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-md border text-sm hover:bg-gray-50"
                title="Open invoice in new tab"
              >
                Open Invoice
              </a>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b mb-4 flex gap-2">
          {[
            ["order", "Order"],
            ["replacements", "Replacements"],
            ["history", "History"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 border-b-2 -mb-px text-sm ${
                activeTab === key
                  ? "border-black text-black font-medium"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : !order ? (
          <p className="text-gray-500">Order not found.</p>
        ) : (
          <>
            {/* TAB: ORDER */}
            {activeTab === "order" && (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left: Items */}
                <div className="lg:col-span-2 bg-white border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold">Items</h2>
                    <span className="text-sm text-gray-600">
                      Placed: {fmtDate(order.createdAt)}
                    </span>
                  </div>

                  <div className="divide-y">
                    {(order.items || []).map((item, i) => (
                      <div key={i} className="py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.image ||
                              item.imageUrl ||
                              item.images?.[0] ||
                              "/products/placeholder.png"
                            }
                            alt={item.name || "Product"}
                            className="w-14 h-14 object-cover rounded border"
                          />
                          <div>
                            <div className="font-medium">{item.name || "Product"}</div>
                            <div className="text-xs text-gray-500">Qty: {item.qty || 1}</div>
                          </div>
                        </div>
                        <div className="font-semibold">₹{(item.price || 0).toLocaleString("en-IN")}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 text-right text-lg font-semibold">
                    Total: ₹{Number(order.total || 0).toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Right: Customer + Status */}
                <div className="space-y-6">
                  <div className="bg-white border rounded-xl p-4">
                    <h3 className="font-semibold mb-3">Customer</h3>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div>
                        <span className="text-gray-500">Name: </span>
                        {order.customer?.name || "—"}
                      </div>
                      <div>
                        <span className="text-gray-500">Email: </span>
                        {order.userId || "—"}
                      </div>
                      <div>
                        <span className="text-gray-500">Phone: </span>
                        {order.customer?.phone || "—"}
                      </div>
                      <div className="pt-2">
                        <div className="text-gray-500">Address:</div>
                        <div>
                          {order.customer?.address || "—"}
                          {order.customer?.city ? `, ${order.customer.city}` : ""}
                          {order.customer?.state ? `, ${order.customer.state}` : ""}
                          {order.customer?.pincode ? ` - ${order.customer.pincode}` : ""}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-xl p-4">
                    <h3 className="font-semibold mb-3">Order Status</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={order.status || "Pending"}
                        onChange={(e) => updateOrderStatus(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm"
                        disabled={isCancelled}
                        title={isCancelled ? "Order is cancelled" : "Change order status"}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>

                      {/* Cancel Button */}
                      {!isCancelled && !isDelivered && (
                        <button
                          onClick={cancelOrder}
                          className="px-3 py-2 rounded-md text-sm bg-red-600 text-white hover:bg-red-700"
                          title="Cancel this order"
                        >
                          Cancel Order
                        </button>
                      )}

                      <span className="text-xs text-gray-500">
                        Payment: {order?.payment?.type || order?.gateway || "—"}
                      </span>

                      {isCancelled && (
                        <span className="ml-auto text-xs font-medium px-2 py-0.5 rounded bg-red-100 text-red-700">
                          Cancelled
                        </span>
                      )}
                    </div>
                    {isDelivered && (
                      <p className="mt-2 text-xs text-gray-500">
                        Delivered orders cannot be cancelled.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: REPLACEMENTS */}
            {activeTab === "replacements" && (
              <div className="bg-white border rounded-xl overflow-hidden">
                {replacements.length === 0 ? (
                  <div className="py-12 text-center text-gray-600">
                    No replacement requests for this order.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left">Reason</th>
                          <th className="px-4 py-3 text-left">Notes</th>
                          <th className="px-4 py-3 text-left">Created</th>
                          <th className="px-4 py-3 text-left">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {replacements.map((r) => {
                          const disabled = isCancelled;
                          return (
                            <tr key={r.id}>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                                  {r.reason || "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3 max-w-[320px]">
                                <div className="text-gray-700 line-clamp-3">
                                  {r.note || "—"}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{fmtDate(r.createdAt)}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={[
                                    "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                    (r.status || "requested") === "approved" && "bg-blue-100 text-blue-800",
                                    (r.status || "requested") === "in_progress" && "bg-purple-100 text-purple-800",
                                    (r.status || "requested") === "pickup_scheduled" && "bg-teal-100 text-teal-800",
                                    (r.status || "requested") === "replacement_shipped" && "bg-indigo-100 text-indigo-800",
                                    (r.status || "requested") === "completed" && "bg-green-100 text-green-800",
                                    (r.status || "requested") === "rejected" && "bg-red-100 text-red-800",
                                    (r.status || "requested") === "requested" && "bg-gray-100 text-gray-700",
                                  ]
                                    .filter(Boolean)
                                    .join(" ")}
                                >
                                  {labelForReplacement(r.status || "requested")}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                  {!disabled && r.status !== "approved" && r.status !== "completed" && r.status !== "rejected" && (
                                    <button
                                      onClick={() => setReplacementStatus(r.id, "approved")}
                                      className="px-3 py-1.5 rounded border hover:bg-gray-50"
                                    >
                                      Approve
                                    </button>
                                  )}
                                  {!disabled && r.status !== "rejected" && r.status !== "completed" && (
                                    <button
                                      onClick={() => setReplacementStatus(r.id, "rejected")}
                                      className="px-3 py-1.5 rounded border hover:bg-gray-50"
                                    >
                                      Reject
                                    </button>
                                  )}
                                  <select
                                    className="px-3 py-1.5 rounded border bg-white"
                                    value=""
                                    disabled={disabled}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      if (val) setReplacementStatus(r.id, val);
                                    }}
                                  >
                                    <option value="">More…</option>
                                    {REPLACEMENT_STATES.filter((s) => s !== (r.status || "requested")).map((s) => (
                                      <option key={s} value={s}>
                                        {labelForReplacement(s)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                {disabled && (
                                  <p className="mt-2 text-xs text-red-600 text-right">
                                    Order is cancelled — actions disabled.
                                  </p>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: HISTORY */}
            {activeTab === "history" && (
              <div className="bg-white border rounded-xl p-4">
                <h3 className="font-semibold mb-3">Status History</h3>
                {historyRows.length === 0 ? (
                  <p className="text-sm text-gray-500">No status changes recorded.</p>
                ) : (
                  <ul className="text-sm divide-y">
                    {historyRows.map((h, i) => (
                      <li key={i} className="py-2 flex items-center justify-between">
                        <div>
                          <span className="font-medium">{h.oldStatus || "—"}</span> →{" "}
                          <span className="font-medium">{h.newStatus || "—"}</span>
                        </div>
                        <div className="text-gray-500">
                          {fmtDate(h.changedAt)} • <i>{h.changedBy || "—"}</i>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Quick links */}
                <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
                  <Link
                    href={`/order/${order.id}`}
                    className="px-3 py-1.5 rounded-md border hover:bg-gray-50"
                  >
                    View Public Order Page
                  </Link>
                  <a
                    href={`${baseURL}/api/invoice/${order.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-md border hover:bg-gray-50"
                  >
                    Open Invoice
                  </a>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

// pages/order/[id].js
"use client";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Head from "next/head";
import Link from "next/link";
import toast from "react-hot-toast";

// ---------------- Timeline Helpers ----------------
const STATUS_STEPS = ["Pending", "Processing", "Shipped", "Out for Delivery", "Delivered"];
const FALLBACK_OFFSETS = { Pending: 0, Processing: 1, Shipped: 3, "Out for Delivery": 5, Delivered: 6 };
const toDateFlexible = (v) => {
  try {
    if (!v) return null;
    if (typeof v?.toDate === "function") return v.toDate();
    if (typeof v?.toMillis === "function") return new Date(v.toMillis());
    if (typeof v === "number" || typeof v === "string") return new Date(v);
    return null;
  } catch {
    return null;
  }
};
const ensureDate = (v, fallback = new Date()) => toDateFlexible(v) || fallback;

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const unsub = onSnapshot(
      doc(db, "orders", id),
      (snap) => {
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        } else {
          setOrder(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Realtime fetch failed:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 text-gray-500">
        Order not found or deleted.
      </div>
    );
  }

  // ---------------- Build Timeline ----------------
  const createdAt = ensureDate(order.createdAt, new Date());
  const currentStep = Math.max(0, STATUS_STEPS.indexOf(order.status || "Pending"));
  const ts = order.statusTimestamps || {};
  const stepDates = STATUS_STEPS.reduce((acc, step) => {
    const actual = ensureDate(ts?.[step], null);
    if (actual) acc[step] = actual;
    else {
      const d = new Date(createdAt);
      d.setDate(d.getDate() + (FALLBACK_OFFSETS[step] ?? 0));
      acc[step] = d;
    }
    return acc;
  }, {});
  const etaFrom = stepDates["Out for Delivery"];
  const etaTo = stepDates["Delivered"];

  return (
    <>
      <Head>
        <title>Order #{order.id.slice(0, 6)} — Warea</title>
      </Head>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">
            Order #{order.id.slice(0, 6)}
          </h1>
          {order.status === "Pending" && (
            <button
              onClick={async () => {
                if (!confirm("Cancel this order?")) return;
                try {
                  await updateDoc(doc(db, "orders", order.id), {
                    status: "Cancelled",
                    "statusTimestamps.Cancelled": serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  });
                  toast.success("Order cancelled.");
                } catch (e) {
                  toast.error("Failed to cancel order.");
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
            >
              Cancel Order
            </button>
          )}
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-semibold text-gray-900">
                {order.status || "Pending"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Placed on{" "}
                {createdAt.toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
              {order.status !== "Cancelled" && etaFrom && etaTo && (
                <p className="text-xs text-gray-600 mt-1">
                  Estimated delivery{" "}
                  <span className="font-medium">
                    {etaFrom.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    –{" "}
                    {etaTo.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="relative mt-6">
            <div className="absolute left-0 right-0 top-4 h-1 bg-gray-200 rounded" />
            <div
              className="absolute left-0 top-4 h-1 bg-green-500 rounded"
              style={{ width: `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` }}
            />
            <div className="relative flex justify-between">
              {STATUS_STEPS.map((label, i) => {
                const reached = i <= currentStep;
                const d = stepDates[label];
                return (
                  <div
                    key={label}
                    className="flex flex-col items-center text-center w-24"
                  >
                    <div
                      className={`w-8 h-8 grid place-items-center rounded-full border-2 text-sm font-semibold ${
                        reached
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-white border-gray-300 text-gray-400"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div
                      className={`mt-2 text-xs ${
                        reached ? "text-green-700 font-medium" : "text-gray-500"
                      }`}
                    >
                      {label}
                    </div>
                    <div className="mt-1 text-[11px] text-gray-400">
                      {d?.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-3">Items</h2>
          <div className="space-y-4">
            {order.items?.map((item, i) => (
              <div
                key={i}
                className="flex justify-between items-center border-b pb-3 last:border-b-0"
              >
                <Link href={`/product/${item.id}`} className="flex items-center gap-3 hover:opacity-90">
                  <img
                    src={
                      item.image ||
                      item.imageUrl ||
                      item.images?.[0] ||
                      "/products/placeholder.png"
                    }
                    alt={item.name}
                    className="w-14 h-14 rounded object-cover border"
                  />
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.qty}</p>
                  </div>
                </Link>
                <p className="font-medium text-sm">
                  ₹{Number(item.price * item.qty).toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-3">Shipping Address</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            {order.customer?.name}, {order.customer?.address},{" "}
            {order.customer?.city}, {order.customer?.state} -{" "}
            {order.customer?.pincode}
          </p>
          {order.customer?.phone && (
            <p className="text-sm text-gray-500 mt-1">
              Phone: {order.customer.phone}
            </p>
          )}
        </div>

        {/* Total */}
        <div className="bg-white rounded-xl shadow p-6 mb-8 flex justify-between text-lg font-semibold">
          <span>Total:</span>
          <span>₹{Number(order.total || 0).toLocaleString("en-IN")}</span>
        </div>

        <div className="text-center mt-8 flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => router.push("/profile")}
            className="px-6 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200"
          >
            ← Back to Profile
          </button>
          {order.status !== "Cancelled" && (
            <button
              onClick={() => window.print()}
              className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800"
            >
              🧾 Print / Download Invoice
            </button>
          )}
        </div>
      </div>
    </>
  );
}

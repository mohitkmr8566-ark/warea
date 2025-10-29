"use client";

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  ClipboardList,
  Calendar,
  MapPin,
  IndianRupee,
  ShieldCheck,
  Download,
  XCircle,
  RefreshCcw
} from "lucide-react";
import toast from "react-hot-toast";
import OrderTimelineModal from "@/components/OrderTimelineModal";



// 🧭 Order Status Steps
const STATUS_STEPS = [
  { key: "Pending", label: "Pending", icon: ClipboardList },
  { key: "Processing", label: "Processing", icon: Package },
  { key: "Shipped", label: "Shipped", icon: Truck },
  { key: "Out for Delivery", label: "Out for Delivery", icon: Truck },
  { key: "Delivered", label: "Delivered", icon: CheckCircle },
];

const fmtINR = (n) => (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

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
  const [timelineOpen, setTimelineOpen] = useState(false);

  // ⚡ Live Firestore Listener
  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(doc(db, "orders", id), (snap) => {
      if (snap.exists()) {
        setOrder({ id: snap.id, ...snap.data() });
        setLoading(false);
      } else {
        setOrder(null);
        setLoading(false);
      }
    });
    return () => unsub();
  }, [id]);

  const createdAt = useMemo(() => (order ? ensureDate(order.createdAt) : null), [order]);

  const statusIndex = useMemo(() => {
    if (!order?.status) return 0;
    return STATUS_STEPS.findIndex((s) => s.key === order.status) >= 0
      ? STATUS_STEPS.findIndex((s) => s.key === order.status)
      : 0;
  }, [order]);

  const statusTimestamps = order?.statusTimestamps || {};
  const etaFrom = statusTimestamps["Out for Delivery"]
    ? ensureDate(statusTimestamps["Out for Delivery"])
    : null;
  const etaTo = statusTimestamps["Delivered"] ? ensureDate(statusTimestamps["Delivered"]) : null;

  const handleCancelOrder = async () => {
    try {
      await updateDoc(doc(db, "orders", order.id), { status: "Cancelled" });
      toast.success("Order cancelled successfully");
      router.push("/profile");
    } catch (err) {
      toast.error("Failed to cancel order");
      console.error(err);
    }
  };

  const handleDownloadInvoice = () => {
    window.open(`/api/invoice/${order.id}`, "_blank");
  };

  // 🧾 Loading State (Shimmer UI)
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <Skeleton height={30} width="30%" />
        <Skeleton height={50} />
        <Skeleton height={120} />
        <Skeleton height={80} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-center px-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Order Not Found</h1>
          <Link href="/profile" className="text-blue-600 hover:text-blue-700">
            Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Order #{order.id.slice(0, 6)} — Warea</title>
      </Head>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Back link */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={16} /> Back to My Orders
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Order #{order.id.slice(0, 6)}
            </h1>
            <p className="text-sm text-gray-600">
              Placed on {createdAt?.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
              {etaFrom && etaTo && (
                <> • ETA {etaFrom.toLocaleDateString(undefined, { month: "short", day: "numeric" })} - {etaTo.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</>
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadInvoice}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium hover:bg-gray-50"
            >
              <Download size={18} /> Download Invoice
            </button>

            {/* 🛑 Cancel Button */}
            {(order.status === "Pending" || order.status === "Processing") && (
              <button
                onClick={handleCancelOrder}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-red-500 text-red-600 hover:bg-red-50 transition"
              >
                <XCircle size={18} /> Cancel Order
              </button>
            )}

            {/* 🔁 Replacement Button */}
            {order.status === "Delivered" && (
              <button
                onClick={() => toast.success("Replacement flow coming soon")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-amber-500 text-amber-600 hover:bg-amber-50 transition"
              >
                <RefreshCcw size={18} /> Request Replacement
              </button>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="hidden sm:block relative mb-10">
          <div className="absolute top-5 left-0 w-full h-[2px] bg-gray-200"></div>
          <div
            className="absolute top-5 left-0 h-[2px] bg-green-500 transition-all duration-500"
            style={{ width: `${(statusIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
          ></div>
          <div className="flex justify-between relative">
            {STATUS_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx <= statusIndex;
              return (
                <div key={step.key} className="flex flex-col items-center text-center w-full">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                      isActive ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                  <p className="mt-2 text-xs font-medium text-gray-800">{step.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 📱 Mobile Timeline Button */}
        <button
          onClick={() => setTimelineOpen(true)}
          className="block sm:hidden mb-6 text-amber-600 font-medium underline"
        >
          View Order Timeline
        </button>

        {/* Items */}
        <div className="space-y-4 mb-10">
          {order.items?.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="rounded-xl border bg-white shadow-sm hover:shadow-md transition p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 w-full sm:w-auto">
                <img
                  src={item.image || item.images?.[0] || "/products/placeholder.png"}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-md border"
                />
                <div>
                  <Link
                    href={`/product/${item.id}`}
                    className="font-semibold text-gray-900 hover:text-amber-600 transition"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-gray-500">
                    Qty: {item.qty || 1} • ₹{fmtINR(item.price)}
                  </p>
                </div>
              </div>
              <span className="font-semibold text-gray-900 ml-auto text-sm">
                ₹{fmtINR(item.qty * item.price)}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Shipping & Payment */}
        <div className="grid sm:grid-cols-2 gap-6 mb-12">
          <div className="bg-gray-50 border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="text-amber-600" size={18} />
              <h3 className="text-sm font-semibold text-gray-800">Shipping Address</h3>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {order.customer?.name}<br />
              {order.customer?.address}<br />
              {order.customer?.city}, {order.customer?.state} {order.customer?.pincode}<br />
              {order.customer?.phone}
            </p>
          </div>

          <div className="bg-gray-50 border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <IndianRupee className="text-amber-600" size={18} />
              <h3 className="text-sm font-semibold text-gray-800">Payment Summary</h3>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{fmtINR(order.total)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>Free</span></div>
              <div className="flex justify-between font-semibold text-gray-900 border-t pt-1">
                <span>Total Paid</span><span>₹{fmtINR(order.total)}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Payment Mode: <span className="font-medium text-gray-800">{order.paymentMode || "Razorpay / COD"}</span>
            </p>
          </div>
        </div>

        {/* Replacement Policy */}
        <div className="bg-white border rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck className="text-amber-600 mt-1" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Replacement Policy</h3>
            <p className="text-sm text-gray-600">
              Warea offers a <strong>7-day replacement</strong> policy from the date of delivery.
              If your product is defective or damaged, you can raise a replacement request through your profile page.
            </p>
          </div>
        </div>
      </div>

      {/* 📱 Timeline Modal */}
      <OrderTimelineModal
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
        order={order}
      />
    </>
  );
}

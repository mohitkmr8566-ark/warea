// pages/profile.js
"use client";

import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useAuth } from "@/store/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";

/* ---------------- Timeline Helpers ---------------- */
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

const initials = (name) =>
  !name
    ? "U"
    : name
        .split(" ")
        .map((n) => n[0]?.toUpperCase())
        .filter(Boolean)
        .slice(0, 2)
        .join("");

/* ---------------- Animation Variants ---------------- */
const tabVariants = {
  hidden: { opacity: 0, scale: 0.98, y: 15 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.98, y: 10, transition: { duration: 0.2 } },
};

const cardVariants = (i) => ({
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: "easeOut" },
  },
});

/* ---------------- Main Component ---------------- */
export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("orders");
  const [profileInfo, setProfileInfo] = useState({ name: "", phone: "", avatarUrl: "" });

  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user?.email) return;

    const unsubOrders = onSnapshot(
      query(collection(db, "orders"), where("userId", "==", user.email), orderBy("createdAt", "desc")),
      (snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubAddr = onSnapshot(
      collection(db, "users", user.email, "addresses"),
      (snap) => setAddresses(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubPay = onSnapshot(
      collection(db, "users", user.email, "paymentMethods"),
      (snap) => setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubCoupon = onSnapshot(
      collection(db, "users", user.email, "coupons"),
      (snap) => setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const unsubNoti = onSnapshot(
      collection(db, "users", user.email, "notifications"),
      (snap) => setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    getDoc(doc(db, "users", user.email)).then((s) => {
      if (s.exists()) setProfileInfo((p) => ({ ...p, ...s.data() }));
    });

    return () => {
      unsubOrders();
      unsubAddr();
      unsubPay();
      unsubCoupon();
      unsubNoti();
    };
  }, [user]);

  /* ---------------- Cancelled Orders Filter ---------------- */
  const cancelledOrders = orders.filter((o) => o.status === "Cancelled");
  const activeOrders = orders.filter((o) => o.status !== "Cancelled");

  /* ---------------- Empty State ---------------- */
  const Empty = ({ img, title, hint, ctaHref, ctaLabel }) => (
    <div className="text-center py-10">
      {img && <img src={img} alt="" className="w-36 mx-auto mb-4 opacity-80" />}
      <p className="font-medium text-gray-800">{title}</p>
      {hint && <p className="text-gray-500 text-sm mb-4">{hint}</p>}
      {ctaHref && (
        <Link
          href={ctaHref}
          className="inline-block px-6 py-2 bg-amber-500 text-gray-900 rounded-md hover:bg-amber-400 transition font-medium"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );

  /* ---------------- Order Card UI ---------------- */
  const OrderCard = ({ o, cancelled, index }) => {
    const createdAt = ensureDate(o.createdAt);
    const stepIndex = Math.max(0, STATUS_STEPS.indexOf(o.status || "Pending"));
    const ts = o.statusTimestamps || {};
    const stepDates = STATUS_STEPS.reduce((acc, step) => {
      acc[step] =
        ensureDate(ts[step]) ||
        new Date(createdAt.getTime() + (FALLBACK_OFFSETS[step] ?? 0) * 24 * 60 * 60 * 1000);
      return acc;
    }, {});
    const etaFrom = stepDates["Out for Delivery"];
    const etaTo = stepDates["Delivered"];
    const firstItem = o.items?.[0];

    return (
      <motion.div
        variants={cardVariants(index)}
        initial="hidden"
        animate="visible"
        className={`rounded-xl border shadow-sm hover:shadow-md hover:-translate-y-1 transition transform p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          cancelled ? "bg-gray-50 border-red-200" : "bg-white"
        }`}
      >
        <div className="flex items-start gap-3 w-full sm:w-auto">
          <img
            src={firstItem?.image || firstItem?.images?.[0] || "/products/placeholder.png"}
            alt={firstItem?.name}
            className="w-20 h-20 object-cover rounded-lg border"
          />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-base truncate">{firstItem?.name || "Product"}</p>
            <p className="text-xs text-gray-500">
              Placed on{" "}
              {createdAt.toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {etaFrom && etaTo && (
                <>
                  {" "}· ETA{" "}
                  {etaFrom.toLocaleDateString(undefined, { month: "short", day: "numeric" })} -{" "}
                  {etaTo.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </>
              )}
            </p>

            {!cancelled && (
              <div className="mt-2 relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-green-500 rounded-full"
                  style={{ width: `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                />
              </div>
            )}
            {cancelled && (
              <div className="mt-2 text-xs text-red-600 font-medium">
                ❌ Order Cancelled
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end sm:justify-normal">
          {!cancelled && (
            <>
              <Link
                href={`/order/${o.id}`}
                className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
              >
                View Details
              </Link>
              <button
                onClick={() => router.push(`/order/${o.id}`)}
                className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
              >
                Track Order
              </button>
            </>
          )}
          <span className={`font-semibold ml-2 text-sm ${cancelled ? "text-red-600" : "text-gray-900"}`}>
            ₹{Number(o.total || 0).toLocaleString("en-IN")}
          </span>
        </div>
      </motion.div>
    );
  };

  /* ---------------- Auth Guard ---------------- */
  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-600 mb-4">You are not logged in.</p>
        <button
          onClick={() => router.push("/login")}
          className="px-6 py-3 bg-amber-500 text-gray-900 rounded-lg hover:bg-amber-400 transition font-medium"
        >
          Login / Sign Up
        </button>
      </div>
    );
  }

  /* ---------------- Render ---------------- */
  return (
    <>
      <Head>
        <title>My Profile — Warea</title>
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full sm:w-64 flex flex-col items-center sm:items-start border rounded-xl p-5 shadow-sm bg-white">
            {profileInfo.avatarUrl ? (
              <img
                src={profileInfo.avatarUrl}
                className="w-20 h-20 rounded-full object-cover mb-3 ring-2 ring-amber-400"
                alt="avatar"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-2xl font-semibold mb-3 ring-2 ring-amber-400">
                {initials(profileInfo.name || user?.name)}
              </div>
            )}
            <div className="text-center sm:text-left">
              <p className="font-semibold text-lg">{profileInfo.name || user?.email}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="mt-4 w-full px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 font-medium"
            >
              Logout
            </button>

            {/* Tabs */}
            <div className="mt-6 w-full space-y-1">
              {[
                ["orders", "My Orders"],
                ["cancelled", "Cancelled Orders"], // 🆕
                ["addresses", "Addresses"],
                ["payments", "Payment Methods"],
                ["coupons", "Coupons"],
                ["notifications", "Notifications"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm transition ${
                    activeTab === key
                      ? "bg-amber-500 text-gray-900 font-medium"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={tabVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* My Orders */}
                {activeTab === "orders" && (
                  <>
                    <h2 className="text-xl font-semibold mb-4">My Orders</h2>
                    {activeOrders.length ? (
                      <div className="space-y-4">
                        {activeOrders.map((o, i) => (
                          <OrderCard key={o.id} o={o} index={i} />
                        ))}
                      </div>
                    ) : (
                      <Empty
                        img="/empty-orders.svg"
                        title="No active orders."
                        hint="Your orders will appear here once placed."
                        ctaHref="/shop"
                        ctaLabel="Start Shopping"
                      />
                    )}
                  </>
                )}

                {/* Cancelled Orders */}
                {activeTab === "cancelled" && (
                  <>
                    <h2 className="text-xl font-semibold mb-4 text-red-600">Cancelled Orders</h2>
                    {cancelledOrders.length ? (
                      <div className="space-y-4">
                        {cancelledOrders.map((o, i) => (
                          <OrderCard key={o.id} o={o} cancelled index={i} />
                        ))}
                      </div>
                    ) : (
                      <Empty
                        img="/empty-cancelled.svg"
                        title="No cancelled orders."
                        hint="Cancelled orders will appear here."
                      />
                    )}
                  </>
                )}

                {/* Addresses */}
                {activeTab === "addresses" && (
                  <>
                    <h2 className="text-xl font-semibold mb-4">My Addresses</h2>
                    {addresses.length ? (
                      <div className="divide-y">
                        {addresses.map((a) => (
                          <div
                            key={a.id}
                            className="py-3 flex justify-between items-center text-sm"
                          >
                            <div>
                              <p className="font-medium">
                                {a.name} — {a.city}, {a.state}
                              </p>
                              <p className="text-gray-600">{a.address}</p>
                              <p className="text-gray-500 text-xs">
                                {a.pincode} | {a.phone}
                              </p>
                              {a.isDefault && (
                                <span className="text-green-600 text-xs font-medium mt-1 inline-block">
                                  Default
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                deleteDoc(doc(db, "users", user.email, "addresses", a.id))
                              }
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Empty
                        img="/empty-address.svg"
                        title="No saved addresses."
                        hint="Save your address to speed up checkout."
                      />
                    )}
                  </>
                )}

                {/* Payments */}
                {activeTab === "payments" && (
                  <Empty
                    img="/empty-payments.svg"
                    title="No saved payment labels."
                    hint="Payments are securely handled by Razorpay / UPI."
                  />
                )}

                {/* Coupons */}
                {activeTab === "coupons" && (
                  <>
                    <h2 className="text-xl font-semibold mb-4">Coupons</h2>
                    {coupons.length ? (
                      <div className="grid gap-3">
                        {coupons.map((c) => (
                          <motion.div
                            key={c.id}
                            variants={cardVariants(0)}
                            initial="hidden"
                            animate="visible"
                            className="border rounded-lg p-4 flex justify-between items-center hover:shadow-sm transition"
                          >
                            <div>
                              <p className="font-semibold text-gray-900">{c.code}</p>
                              <p className="text-xs text-gray-500">{c.description}</p>
                            </div>
                            <span className="text-sm font-semibold text-green-600">
                              {c.discount}% OFF
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <Empty img="/empty-coupons.svg" title="No coupons found." />
                    )}
                  </>
                )}

                {/* Notifications */}
                {activeTab === "notifications" && (
                  <>
                    <h2 className="text-xl font-semibold mb-4">Notifications</h2>
                    {notifications.length ? (
                      <div className="space-y-3">
                        {notifications.map((n, i) => (
                          <motion.div
                            key={n.id}
                            variants={cardVariants(i)}
                            initial="hidden"
                            animate="visible"
                            className="border rounded-lg p-3 hover:bg-gray-50 transition"
                          >
                            <p className="font-medium">{n.title}</p>
                            <p className="text-xs text-gray-500">{n.message}</p>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <Empty img="/empty-notifications.svg" title="No notifications." />
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}

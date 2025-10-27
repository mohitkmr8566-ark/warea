// pages/profile.js
"use client";

import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/store/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ----------------- Timeline helpers -----------------
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

// ----------------- UI helpers -----------------
const initials = (name) =>
  !name
    ? "U"
    : name
        .split(" ")
        .map((n) => n[0]?.toUpperCase())
        .filter(Boolean)
        .slice(0, 2)
        .join("");

const fadeSlide = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

// ----------------- Component -----------------
export default function ProfilePage() {
  const { user, logout, login, signup, googleLogin } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("orders");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [trackModal, setTrackModal] = useState({ open: false, order: null });

  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const [profileInfo, setProfileInfo] = useState({ name: "", phone: "", avatarUrl: "" });

  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [coupons, setCoupons] = useState([]);

  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });

  useEffect(() => {
    if (!user?.email) return;

    const qOrders = query(
      collection(db, "orders"),
      where("userId", "==", user.email),
      orderBy("createdAt", "desc")
    );
    const unsub1 = onSnapshot(qOrders, (snap) =>
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const qAddr = query(collection(db, "users", user.email, "addresses"));
    const unsub2 = onSnapshot(qAddr, (snap) =>
      setAddresses(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const qPay = query(collection(db, "users", user.email, "paymentMethods"));
    const unsub3 = onSnapshot(qPay, (snap) =>
      setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const qNot = query(collection(db, "users", user.email, "notifications"));
    const unsub4 = onSnapshot(qNot, (snap) =>
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const qCoupon = query(collection(db, "users", user.email, "coupons"));
    const unsub5 = onSnapshot(qCoupon, (snap) =>
      setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
    };
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;
    getDoc(doc(db, "users", user.email)).then((s) => {
      if (s.exists()) setProfileInfo((p) => ({ ...p, ...s.data() }));
    });
  }, [user]);

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!user?.email) return;
    if (newAddress.isDefault) {
      const prev = addresses.find((a) => a.isDefault);
      if (prev) {
        await updateDoc(doc(db, "users", user.email, "addresses", prev.id), { isDefault: false });
      }
    }
    await addDoc(collection(db, "users", user.email, "addresses"), newAddress);
    toast.success("Address added.");
    setShowAddressModal(false);
    setNewAddress({
      name: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
    });
  };

  const handleDeletePayment = async (id) => {
    if (!user?.email) return;
    await deleteDoc(doc(db, "users", user.email, "paymentMethods", id));
  };

  const Empty = ({ img = "", title = "", hint = "", ctaHref = "", ctaLabel = "" }) => (
    <div className="text-center py-12">
      {img ? (
        <img
          src={img}
          alt=""
          className="w-40 mx-auto mb-4 opacity-80"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      ) : null}
      <p className="text-gray-700 font-medium mb-1">{title}</p>
      {hint ? <p className="text-gray-500 mb-4">{hint}</p> : null}
      {ctaHref && ctaLabel ? (
        <Link href={ctaHref} className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );

  if (!user) {
    return (
      <>
        <Head>
          <title>Profile — Warea</title>
        </Head>
        <div className="text-center py-20">
          <p className="text-gray-600 mb-4">You are not logged in.</p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
          >
            Login / Sign Up
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Profile — Warea</title>
      </Head>

      {/* Gold Header */}
      <div className="bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#E5C07B] py-10 text-black text-center">
        <div className="page-container flex flex-col items-center">
          {profileInfo.avatarUrl ? (
            <img
              src={profileInfo.avatarUrl}
              alt="Avatar"
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg mb-3"
            />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center bg-white text-gray-800 rounded-full text-2xl font-bold mb-3 shadow-lg">
              {initials(profileInfo.name || user?.name)}
            </div>
          )}
          <h1 className="text-2xl font-bold">{profileInfo.name || user?.name}</h1>
          <p className="text-sm">{user?.email}</p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowProfileModal(true)}
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
            >
              ✏️ Edit Profile
            </button>
            <button onClick={() => logout()} className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200 transition">
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 bg-white z-20 border-b">
        <div className="flex justify-center gap-4 py-3 px-4 overflow-x-auto">
          {["orders", "addresses", "payments", "coupons", "notifications"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`relative pb-2 font-medium whitespace-nowrap ${
                activeTab === tab ? "text-black" : "text-gray-500 hover:text-black"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute left-0 right-0 -bottom-0.5 h-[3px] rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, #D4AF37, #FFD700, #E5C07B, #FFD700, #D4AF37)",
                    backgroundSize: "300% 100%",
                  }}
                  animate={{ backgroundPositionX: ["0%", "100%"] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="page-container py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={fadeSlide}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.35 }}
          >
            {/* Orders Tab */}
            {activeTab === "orders" && (
              <>
                <h2 className="text-xl font-semibold mb-4">Your Orders</h2>
                {orders.length ? (
                  <div className="space-y-4">
                    {orders.map((o) => {
                      const createdAt = ensureDate(o.createdAt, new Date());
                      const stepIndex = Math.max(0, STATUS_STEPS.indexOf(o.status || "Pending"));
                      const ts = o.statusTimestamps || {};
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
                        <div key={o.id} className="rounded-xl border bg-white shadow-sm hover:shadow-md transition p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">Order</span>
                                <span className="font-semibold truncate">#{String(o.id).slice(0, 6)}</span>
                                {o.status && (
                                  <span
                                    className={`text-[11px] px-2 py-0.5 rounded-full ml-1 ${
                                      o.status === "Cancelled"
                                        ? "bg-red-50 text-red-600 border border-red-200"
                                        : "bg-blue-50 text-blue-700 border border-blue-200"
                                    }`}
                                  >
                                    {o.status}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                Placed on {createdAt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                                {o.status !== "Cancelled" && etaFrom && etaTo ? (
                                  <>
                                    {" · ETA "}
                                    {etaFrom.toLocaleDateString(undefined, { month: "short", day: "numeric" })} –{" "}
                                    {etaTo.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                  </>
                                ) : null}
                              </div>
                              <div className="mt-3 relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="absolute left-0 top-0 h-full bg-green-500 rounded-full"
                                  style={{ width: `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                                />
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {o.items?.length || 0} item(s) · ₹{Number(o.total || 0).toLocaleString("en-IN")}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                onClick={() => setTrackModal({ open: true, order: o })}
                                className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
                              >
                                Track Order
                              </button>
                              <button
                                onClick={() => (window.location.href = `/order/${o.id}`)}
                                className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
                              >
                                View Details
                              </button>
                              {o.status === "Pending" && (
                                <button
                                  onClick={async () => {
                                    if (!confirm("Cancel this order?")) return;
                                    await updateDoc(doc(db, "orders", o.id), {
                                      status: "Cancelled",
                                      "statusTimestamps.Cancelled": serverTimestamp(),
                                      updatedAt: serverTimestamp(),
                                    });
                                    toast.success("Order cancelled.");
                                  }}
                                  className="px-3 py-1.5 rounded-md bg-red-500 text-white text-sm hover:bg-red-600"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Empty
                    img="/empty-orders.svg"
                    title="No orders yet."
                    hint="When you place an order, it will show up here."
                    ctaHref="/shop"
                    ctaLabel="Start Shopping"
                  />
                )}
              </>
            )}

            {/* Addresses */}
            {activeTab === "addresses" && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Saved Addresses</h2>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 text-sm"
                  >
                    ➕ Add Address
                  </button>
                </div>
                {addresses.length ? (
                  <div className="divide-y">
                    {addresses.map((a) => (
                      <div key={a.id} className="py-3 flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium">
                            {a.name} — {a.city}, {a.state}
                          </p>
                          <p className="text-gray-600">{a.address}</p>
                          <p className="text-gray-500 text-xs">{a.pincode} | {a.phone}</p>
                          {a.isDefault && (
                            <span className="text-green-600 text-xs font-medium mt-1 inline-block">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => deleteDoc(doc(db, "users", user.email, "addresses", a.id))}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty
                    img="/empty-address.svg"
                    title="No addresses saved."
                    hint="Save your address to speed up checkout."
                    ctaHref="#"
                    ctaLabel="Add Address"
                  />
                )}
              </>
            )}

            {/* Payments — removed fake card UI */}
            {activeTab === "payments" && (
              <>
                <h2 className="text-xl font-semibold mb-4">Payment Methods</h2>
                <Empty
                  img="/empty-payments.svg"
                  title="No saved payment labels."
                  hint="Payments are securely handled by Razorpay / UPI."
                />
              </>
            )}

            {/* Coupons */}
            {activeTab === "coupons" && (
              <>
                <h2 className="text-xl font-semibold mb-4">Coupons</h2>
                {coupons.length ? (
                  <div className="grid gap-3">
                    {coupons.map((c) => (
                      <div key={c.id} className="border rounded-lg p-4 flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{c.code}</p>
                          <p className="text-xs text-gray-500">{c.description}</p>
                        </div>
                        <span className="text-sm font-semibold text-green-600">{c.discount}%</span>
                      </div>
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
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="border rounded-lg p-3 hover:bg-gray-50 transition"
                      >
                        <p className="font-medium">{n.title}</p>
                        <p className="text-xs text-gray-500">{n.message}</p>
                      </div>
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

      {/* ================= Track Order Modal ================= */}
      {trackModal.open && trackModal.order && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="h-1.5 bg-gradient-to-r from-[#D4AF37] via-[#FFD700] to-[#E5C07B]" />
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Track Order</h3>
                  <p className="text-xs text-gray-500">
                    Order #{String(trackModal.order.id).slice(0, 6)}
                  </p>
                </div>
                <button onClick={() => setTrackModal({ open: false, order: null })} className="text-gray-500">
                  ✕
                </button>
              </div>

              {(() => {
                const o = trackModal.order;
                const createdAt = ensureDate(o.createdAt, new Date());
                const idx = Math.max(0, STATUS_STEPS.indexOf(o.status || "Pending"));
                const ts = o.statusTimestamps || {};
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
                    {o.status !== "Cancelled" && etaFrom && etaTo && (
                      <div className="mt-2 text-sm">
                        Estimated delivery{" "}
                        <span className="font-medium">
                          {etaFrom.toLocaleDateString(undefined, { month: "short", day: "numeric" })} –{" "}
                          {etaTo.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    )}
                    <div className="relative mt-6">
                      <div className="absolute left-0 right-0 top-4 h-1 bg-gray-200 rounded" />
                      <div
                        className="absolute left-0 top-4 h-1 bg-green-500 rounded"
                        style={{ width: `${(idx / (STATUS_STEPS.length - 1)) * 100}%` }}
                      />
                      <div className="relative flex justify-between">
                        {STATUS_STEPS.map((label, i) => {
                          const reached = i <= idx;
                          const d = stepDates[label];
                          return (
                            <div key={label} className="flex flex-col items-center text-center w-24">
                              <div
                                className={`w-8 h-8 grid place-items-center rounded-full border-2 text-sm font-semibold ${
                                  reached
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "bg-white border-gray-300 text-gray-400"
                                }`}
                              >
                                {i + 1}
                              </div>
                              <div className={`mt-2 text-xs ${reached ? "text-green-700 font-medium" : "text-gray-500"}`}>
                                {label}
                              </div>
                              <div className="mt-1 text-[11px] text-gray-400">
                                {d?.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2 justify-end">
                      <button
                        onClick={() => (window.location.href = `/order/${o.id}`)}
                        className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => setTrackModal({ open: false, order: null })}
                        className="px-3 py-1.5 rounded-md bg-black text-white text-sm hover:bg-gray-800"
                      >
                        Close
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}

// pages/checkout.js
"use client";

import { useCart } from "@/store/CartContext";
import { useAuth } from "@/store/AuthContext";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  onSnapshot,
} from "firebase/firestore";
import toast from "react-hot-toast";
import Script from "next/script";
import { motion } from "framer-motion";
import { zoneFromPincode, etaRange } from "@/lib/logistics";

export default function CheckoutPage() {
  const { items = [], clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    pincode: "",
    city: "",
    state: "",
  });
  const [selectedPayment, setSelectedPayment] = useState("cod");
  const [addresses, setAddresses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + Number(item.price || 0) * Number(item.qty || 1),
        0
      ),
    [items]
  );

  useEffect(() => {
    if (!user?.email) return;
    const q = query(collection(db, "users", user.email, "addresses"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAddresses(data);
      const def = data.find((a) => a.isDefault) || data[0];
      if (def) setForm(def);
    });
    return () => unsub();
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const normalizeCartItem = (item) => {
    const qty = Math.max(1, Number(item.qty || 1));
    const image =
      item.image ||
      item.imageUrl ||
      (Array.isArray(item.images) && (item.images[0]?.url || item.images[0])) ||
      "";
    return {
      id: item.id,
      name: item.title || item.name || "Product",
      price: Number(item.price || 0),
      qty,
      image,
    };
  };

  // ✅ Razorpay Flow (Safe - No Changes Removed)
  async function handleRazorpayPayment(orderPayload) {
    try {
      const res = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: orderPayload.total, receiptNote: user?.email }),
      });

      const data = await res.json();
      if (!data?.order?.id) throw new Error("Failed to initialize Razorpay order");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        order_id: data.order.id,
        name: "Warea Jewellery",
        description: "Jewellery Purchase",
        prefill: {
          name: form.name || user?.displayName || "",
          email: user?.email || "",
          contact: form.phone || "",
        },
        notes: { cartSize: items.length }, // ✅ Kept
        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/verify-razorpay", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                orderPayload: {
                  ...orderPayload,
                  address: orderPayload.customer,
                },
              }),
            });

            const out = await verifyRes.json();
            if (out?.ok) {
              toast.success("✅ Payment Successful!");
              clearCart();
              router.push(`/order-success?id=${out.orderId || out.id}`);
            } else {
              toast.error("Verification failed. Refund will be processed if deducted.");
            }
          } catch (err) {
            console.error(err);
            toast.error("Payment verification failed.");
          }
        },
        modal: { ondismiss: () => toast("Payment cancelled.") },
        theme: { color: "#D4AF37" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Payment could not be started. Try again.");
    }
  }

  // ✅ Submit (COD + Razorpay)
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!user?.email) return toast.error("Please sign in.");

      if (!form.name || !form.phone || !form.address || !form.pincode) {
        setError("Please fill all required details.");
        return;
      }

      if (!items.length) {
        toast.error("Your cart is empty!");
        return;
      }

      const itemsWithImage = items.map(normalizeCartItem);
      const orderPayload = {
        userId: user.email,
        customer: { ...form },
        items: itemsWithImage,
        total: subtotal,
        status: "Pending",
        statusTimestamps: { Pending: serverTimestamp() },
        paymentMode: selectedPayment === "cod" ? "COD" : "Razorpay",
        payment: { type: selectedPayment === "cod" ? "COD" : "Razorpay" },
        createdAt: serverTimestamp(),
      };

      if (selectedPayment === "cod") {
        const zone = zoneFromPincode(form.pincode);
        const eta = etaRange(zone);

        const ref = await addDoc(collection(db, "orders"), {
          ...orderPayload,
          logistics: {
            zone,
            eta: { start: eta.start, end: eta.end },
          },
        });

        toast.success("✅ Order placed!");
        clearCart();
        router.push(`/order-success?id=${ref.id}`);
      } else {
        await handleRazorpayPayment(orderPayload);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      {/* ✅ Header */}
      <section className="bg-gradient-to-b from-gray-50 to-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-serif font-bold"
          >
            Checkout
          </motion.h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Enter your details and place your order securely.
          </p>
        </div>
      </section>

      {/* ✅ Form + Summary */}
      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* --- Form --- */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-md border space-y-6">
          <h2 className="text-xl font-semibold">Shipping Details</h2>
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {/* Saved Addresses */}
          {addresses.length > 0 && (
            <div>
              <label className="text-sm font-medium">Select Address</label>
              <select
                onChange={(e) => {
                  const addr = addresses.find((a) => a.id === e.target.value);
                  if (addr) setForm(addr);
                }}
                className="w-full border rounded-md px-3 py-2 mt-1"
                value={addresses.find((a) => a.address === form.address)?.id || ""}
              >
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.city}, {a.state}
                    {a.isDefault ? " (Default)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Fields */}
          {["name", "phone", "address", "pincode", "city", "state"].map((field) => (
            <div key={field}>
              <label className="text-sm font-medium capitalize">{field}</label>
              {field === "address" ? (
                <textarea
                  name={field}
                  rows={3}
                  value={form[field] || ""}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-yellow-400"
                />
              ) : (
                <input
                  name={field}
                  value={form[field] || ""}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-yellow-400"
                />
              )}
            </div>
          ))}

          {/* Payment */}
          <div>
            <label className="text-sm font-medium">Payment Method</label>
            <div
              onClick={() => setSelectedPayment("cod")}
              className={`mt-2 p-3 border rounded-lg cursor-pointer ${
                selectedPayment === "cod" ? "border-yellow-400 bg-yellow-50" : "hover:bg-gray-50"
              }`}
            >
              <input type="radio" checked={selectedPayment === "cod"} readOnly /> Cash on Delivery
            </div>

            <div
              onClick={() => setSelectedPayment("razorpay")}
              className={`mt-2 p-3 border rounded-lg cursor-pointer ${
                selectedPayment === "razorpay" ? "border-yellow-400 bg-yellow-50" : "hover:bg-gray-50"
              }`}
            >
              <input type="radio" checked={selectedPayment === "razorpay"} readOnly /> Pay Online (Razorpay)
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Card/UPI details are securely handled by Razorpay.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-full hover:bg-gray-800 transition disabled:opacity-60"
          >
            {loading ? "Processing..." : "Place Order"}
          </button>
        </form>

        {/* --- Summary --- */}
        <div className="bg-white p-6 rounded-3xl shadow-md border h-fit">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          {items.length ? (
            <div className="space-y-4">
              {items.map((p) => (
                <div key={p.id} className="flex justify-between text-sm border-b pb-1">
                  <span>{p.title || p.name} × {p.qty || 1}</span>
                  <span>₹{(Number(p.price || 0) * (p.qty || 1)).toLocaleString("en-IN")}</span>
                </div>
              ))}
              <div className="flex justify-between font-semibold text-lg pt-4">
                <span>Total</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <p className="text-xs text-gray-500">Taxes & shipping calculated at checkout.</p>
            </div>
          ) : (
            <p className="text-gray-500">Your cart is empty.</p>
          )}
        </div>
      </div>
    </>
  );
}

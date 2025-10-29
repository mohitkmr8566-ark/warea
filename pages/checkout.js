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
import { zoneFromPincode, etaRange } from "@/lib/logistics"; // 🆕 ETA utility import

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
      Number(
        items.reduce(
          (s, i) => s + Number(i.price || 0) * Number(i.qty || 1),
          0
        )
      ) || 0,
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

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function normalizeCartItem(i) {
    const qty = Math.max(1, Number(i.qty || 1));
    const firstArrayUrl =
      (Array.isArray(i.images) &&
        i.images[0] &&
        (i.images[0].url || i.images[0])) ||
      "";
    const image = i.image || i.imageUrl || firstArrayUrl || "";

    return {
      id: i.id,
      name: i.title || i.name || "Product",
      price: Number(i.price || 0),
      qty,
      image,
    };
  }

  async function handleRazorpayPayment(orderPayload) {
    try {
      const res = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: orderPayload.total,
          receiptNote: user?.email,
        }),
      });
      const data = await res.json();
      if (!data?.order?.id) throw new Error("Razorpay order creation failed");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        order_id: data.order.id,
        name: process.env.NEXT_PUBLIC_APP_NAME || "Warea",
        description: "Jewellery Purchase",
        prefill: {
          name: form.name || user?.displayName || "",
          email: user?.email || "",
          contact: form.phone || "",
        },
        notes: { cartSize: items.length },
        handler: async function (resp) {
          try {
            const verifyRes = await fetch("/api/verify-razorpay", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_signature: resp.razorpay_signature,
                orderPayload: {
                  ...orderPayload,
                  address: orderPayload.customer, // 🆕 ensures backend always gets pincode properly
                },
              }),
            });

            const out = await verifyRes.json();
            if (out?.ok) {
              toast.success("✅ Payment successful!");
              clearCart();
              const oid = out.orderId || out.id || "";
              router.push(oid ? `/order-success?id=${oid}` : "/order-success");
            } else {
              toast.error(
                "Verification failed. If the amount was captured, it will be refunded."
              );
            }
          } catch (err) {
            console.error(err);
            toast.error("Could not verify payment. Please contact support.");
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

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!user?.email) {
        toast.error("Please sign in before placing an order.");
        return;
      }
      if (
        !form.name ||
        !form.phone ||
        !form.address ||
        !form.pincode ||
        !form.city ||
        !form.state
      ) {
        setError("Please fill in all required fields.");
        return;
      }
      if (items.length === 0) {
        toast.error("Your cart is empty!");
        return;
      }

      const itemsWithImage = items.map(normalizeCartItem);

      const orderPayload = {
        userId: user.email,
        customer: {
          name: form.name,
          phone: form.phone,
          address: form.address,
          pincode: form.pincode,
          city: form.city,
          state: form.state,
        },
        items: itemsWithImage,
        total: subtotal,
        status: "Pending",
        statusTimestamps: { Pending: serverTimestamp() },
        paymentMode: selectedPayment === "cod" ? "COD" : "Razorpay",
        payment: { type: selectedPayment === "cod" ? "COD" : "Razorpay" },
        createdAt: serverTimestamp(),
      };

      if (selectedPayment === "cod") {
        // 🆕 ETA & zone calculation
        const zone = zoneFromPincode(form.pincode);
        const eta = etaRange(zone);

        const finalPayload = {
          ...orderPayload,
          logistics: {
            zone,
            eta: {
              start: eta.start,
              end: eta.end,
            },
          },
        };

        const ref = await addDoc(collection(db, "orders"), finalPayload);
        toast.success("✅ Order placed successfully!");
        clearCart();
        router.push(`/order-success?id=${ref.id}`);
      } else {
        await handleRazorpayPayment(orderPayload);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <section className="bg-gradient-to-b from-gray-50 to-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-serif font-bold mb-3"
          >
            Checkout
          </motion.h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto">
            Enter your shipping details and complete your order securely.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white border rounded-3xl shadow-md p-6 hover:shadow-xl transition"
        >
          <h2 className="text-xl font-semibold mb-2">Shipping Address</h2>
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {addresses.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">Choose Saved Address</label>
              <select
                onChange={(e) => {
                  const addr = addresses.find((a) => a.id === e.target.value);
                  if (addr) setForm(addr);
                }}
                className="w-full border rounded-md px-3 py-2"
                value={
                  addresses.find(
                    (a) => a.name === form.name && a.address === form.address
                  )?.id || ""
                }
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

          {["name", "phone", "address", "pincode", "city", "state"].map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium capitalize">{field}</label>
              {field === "address" ? (
                <textarea
                  name={field}
                  value={form[field] || ""}
                  onChange={handleChange}
                  rows={3}
                  className="w-full border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                />
              ) : (
                <input
                  name={field}
                  value={form[field] || ""}
                  onChange={handleChange}
                  className="w-full border rounded-md px-3 py-2 mt-1 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400"
                />
              )}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium mb-2">Payment Method</label>

            <div
              onClick={() => setSelectedPayment("cod")}
              className={`border rounded-lg p-3 mb-2 flex items-center justify-between cursor-pointer transition ${
                selectedPayment === "cod"
                  ? "border-yellow-400 bg-yellow-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={selectedPayment === "cod"}
                  onChange={() => setSelectedPayment("cod")}
                />
                <span className="text-sm font-medium">Cash on Delivery</span>
              </div>
              <span className="text-xs text-gray-500">Pay at delivery</span>
            </div>

            <div
              onClick={() => setSelectedPayment("razorpay")}
              className={`border rounded-lg p-3 flex items-center justify-between cursor-pointer transition ${
                selectedPayment === "razorpay"
                  ? "border-yellow-400 bg-yellow-50"
                  : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={selectedPayment === "razorpay"}
                  onChange={() => setSelectedPayment("razorpay")}
                />
                <span className="text-sm font-medium">Pay Online (Razorpay)</span>
              </div>
              <span className="text-xs text-gray-500">UPI / Card / Wallet</span>
            </div>

            <p className="text-xs text-gray-500 mt-1">
              Card details are handled securely by Razorpay. We don’t store your card info.
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

        <div className="bg-white border rounded-3xl shadow-md p-6 h-fit hover:shadow-xl transition">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          {items.length ? (
            <div className="space-y-4">
              {items.map((p) => (
                <div key={p.id} className="flex justify-between text-sm border-b pb-1">
                  <span>
                    {p.title || p.name} × {p.qty || 1}
                  </span>
                  <span>
                    ₹{(Number(p.price || 0) * Number(p.qty || 1)).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
              <div className="border-t pt-4 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Taxes & shipping calculated at checkout.
              </p>
            </div>
          ) : (
            <p className="text-gray-500">Your cart is empty.</p>
          )}
        </div>
      </div>
    </>
  );
}

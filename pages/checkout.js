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
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.price * (i.qty || 1), 0);

  // 🏡 Fetch Addresses
  useEffect(() => {
    if (!user?.email) return;
    const q = query(collection(db, "users", user.email, "addresses"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAddresses(data);
      const def = data.find((a) => a.isDefault);
      if (def) setForm(def);
    });
    return () => unsub();
  }, [user]);

  // 💳 Fetch Payment Methods
  useEffect(() => {
    if (!user?.email) return;
    const q = query(collection(db, "users", user.email, "paymentMethods"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPayments(data);
      if (data.length > 0) {
        setSelectedPayment(data[0].id);
      } else {
        setSelectedPayment("cod");
      }
    });
    return () => unsub();
  }, [user]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // 💳 Razorpay payment flow
  async function handleRazorpayPayment(orderPayload) {
    try {
      // 1. Create order on server
      const res = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: orderPayload.total, receiptNote: user?.email }),
      });
      const data = await res.json();
      if (!data?.order?.id) throw new Error("Order creation failed");

      // 2. Configure Razorpay modal
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
          // 3. Verify + save order on server
          const verifyRes = await fetch("/api/verify-razorpay", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_signature: resp.razorpay_signature,
              orderPayload,
            }),
          });

          const out = await verifyRes.json();
          if (out?.ok) {
            toast.success("✅ Payment Successful!");
            clearCart();
            router.push("/order-success");
          } else {
            toast.error("Verification failed. If amount was captured, it will be refunded.");
          }
        },
        modal: {
          ondismiss: function () {
            toast("Payment cancelled.");
          },
        },
        theme: { color: "#f59e0b" },
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

    if (!user?.email) {
      toast.error("Please sign in before placing an order.");
      setLoading(false);
      return;
    }

    if (!form.name || !form.phone || !form.address || !form.pincode) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty!");
      setLoading(false);
      return;
    }

    if (!selectedPayment) {
      toast.error("Please select a payment method.");
      setLoading(false);
      return;
    }

    // 🧾 Build order payload (common)
    const orderPayload = {
      items: items.map((i) => ({
        id: i.id,
        name: i.title,
        price: i.price,
        qty: i.qty || 1,
      })),
      total: subtotal,
      address: form,
      user: { email: user.email },
    };

    if (selectedPayment === "cod") {
      try {
        const orderData = {
          ...orderPayload,
          userId: user.email,
          status: "Pending",
          payment: { type: "COD" },
          createdAt: serverTimestamp(),
        };

        const ref = await addDoc(collection(db, "orders"), orderData);
        toast.success("✅ Order placed successfully!");
        clearCart();
        router.push(`/order-success?id=${ref.id}`);
      } catch (err) {
        console.error("Failed to place COD order:", err);
        toast.error("Something went wrong. Please try again!");
      } finally {
        setLoading(false);
      }
    } else {
      // 🪙 Handle Razorpay
      await handleRazorpayPayment(orderPayload);
      setLoading(false);
    }
  }

  return (
    <>
      {/* Razorpay Checkout Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 🏡 Address Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-white shadow-md rounded-lg p-6"
          >
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
            {error && <p className="text-red-600 text-sm">{error}</p>}

            {addresses.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Choose Saved Address
                </label>
                <select
                  onChange={(e) => {
                    const addr = addresses.find((a) => a.id === e.target.value);
                    if (addr) setForm(addr);
                  }}
                  className="w-full border rounded-md px-3 py-2"
                >
                  {addresses.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} — {a.city}, {a.state}
                      {a.isDefault && " (Default)"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {["name", "phone", "address", "pincode", "city", "state"].map(
              (field) => (
                <div key={field}>
                  <label className="block text-sm font-medium capitalize">
                    {field}
                  </label>
                  {field === "address" ? (
                    <textarea
                      name={field}
                      value={form[field] || ""}
                      onChange={handleChange}
                      rows={3}
                      className="w-full border rounded-md px-3 py-2 mt-1"
                    />
                  ) : (
                    <input
                      name={field}
                      value={form[field] || ""}
                      onChange={handleChange}
                      className="w-full border rounded-md px-3 py-2 mt-1"
                    />
                  )}
                </div>
              )
            )}

            {/* 💳 Payment Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Payment Method
              </label>

              <div className="flex items-center mb-2">
                <input
                  type="radio"
                  id="cod"
                  name="payment"
                  value="cod"
                  checked={selectedPayment === "cod"}
                  onChange={() => setSelectedPayment("cod")}
                  className="mr-2"
                />
                <label htmlFor="cod" className="text-sm">
                  Cash on Delivery (COD)
                </label>
              </div>

              {/* Razorpay Option */}
              <div className="flex items-center mb-2">
                <input
                  type="radio"
                  id="razorpay"
                  name="payment"
                  value="razorpay"
                  checked={selectedPayment === "razorpay"}
                  onChange={() => setSelectedPayment("razorpay")}
                  className="mr-2"
                />
                <label htmlFor="razorpay" className="text-sm">
                  Pay Online (Razorpay)
                </label>
              </div>

              {payments.map((p) => (
                <div key={p.id} className="flex items-center mb-2">
                  <input
                    type="radio"
                    id={p.id}
                    name="payment"
                    value={p.id}
                    checked={selectedPayment === p.id}
                    onChange={() => setSelectedPayment(p.id)}
                    className="mr-2"
                  />
                  <label htmlFor={p.id} className="text-sm">
                    **** **** **** {p.cardNumber.slice(-4)} — {p.nameOnCard}
                  </label>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white py-3 rounded-md hover:bg-gray-700 transition"
            >
              {loading ? "Processing..." : "Place Order"}
            </button>
          </form>

          {/* 🧾 Order Summary */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            {items.length ? (
              <div className="space-y-4">
                {items.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between text-sm border-b pb-1"
                  >
                    <span>
                      {p.title} × {p.qty || 1}
                    </span>
                    <span>₹{p.price * (p.qty || 1)}</span>
                  </div>
                ))}
                <div className="border-t pt-4 flex justify-between font-semibold">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Your cart is empty.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

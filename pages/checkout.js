"use client";

import { useCart } from "@/store/CartContext";
import { useAuth } from "@/store/AuthContext";
import { useState } from "react";
import { useRouter } from "next/router";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const { items = [], clearCart } = useCart();
  const { user } = useAuth(); // 👈 get current user
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    pincode: "",
    city: "",
    state: "",
  });
  const [error, setError] = useState("");

  const subtotal = items.reduce((s, i) => s + i.price * (i.qty || 1), 0);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ✅ Firestore Order Submission
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.phone || !form.address || !form.pincode) {
      setError("Please fill in all required fields.");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty!");
      return;
    }

    try {
      const orderData = {
        userId: user?.email || "guest",
        customer: form,
        items: items.map((i) => ({
          id: i.id,
          name: i.title,
          price: i.price,
          qty: i.qty || 1,
        })),
        total: subtotal,
        status: "Pending",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "orders"), orderData);

      toast.success("Order placed successfully ✅");
      clearCart();

      setTimeout(() => router.push("/order-success"), 1500);
    } catch (err) {
      console.error("Failed to place order:", err);
      toast.error("Something went wrong. Please try again!");
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Address Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white shadow-md rounded-lg p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {["name", "phone", "address", "pincode", "city", "state"].map(
            (field) => (
              <div key={field}>
                <label className="block text-sm font-medium capitalize">
                  {field}
                </label>
                {field === "address" ? (
                  <textarea
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border rounded-md px-3 py-2 mt-1"
                    placeholder={
                      field === "address" ? "Street, Locality" : field
                    }
                  />
                ) : (
                  <input
                    name={field}
                    value={form[field]}
                    onChange={handleChange}
                    className="w-full border rounded-md px-3 py-2 mt-1"
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  />
                )}
              </div>
            )
          )}

          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-3 rounded-md hover:bg-gray-700 transition"
          >
            Place Order
          </button>
        </form>

        {/* Order Summary */}
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
  );
}

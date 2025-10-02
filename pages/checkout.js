"use client";

import { useCart } from "@/store/CartContext";
import { useState } from "react";
import { useRouter } from "next/router";

export default function CheckoutPage() {
  const { items = [] } = useCart();
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

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name || !form.phone || !form.address || !form.pincode) {
      setError("Please fill in all required fields.");
      return;
    }

    console.log("Order placed:", { form, items });
    router.push("/order-success");
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Address Form */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div>
            <label className="block text-sm">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 mt-1"
              placeholder="Full Name"
            />
          </div>
          <div>
            <label className="block text-sm">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 mt-1"
              placeholder="Mobile Number"
            />
          </div>
          <div>
            <label className="block text-sm">Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-md px-3 py-2 mt-1"
              placeholder="Street, Locality"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm">Pincode</label>
              <input
                name="pincode"
                value={form.pincode}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 mt-1"
                placeholder="123456"
              />
            </div>
            <div>
              <label className="block text-sm">City</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 mt-1"
                placeholder="City"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm">State</label>
            <input
              name="state"
              value={form.state}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 mt-1"
              placeholder="State"
            />
          </div>

          <button type="submit" className="w-full bg-gray-900 text-white py-3 rounded-md hover:bg-gray-700">
            Place Order
          </button>
        </form>

        {/* Order Summary */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          {items.length ? (
            <div className="space-y-4">
              {items.map((p) => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span>
                    {p.name} x {p.qty || 1}
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

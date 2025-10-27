"use client";

import { useRouter } from "next/router";
import { motion } from "framer-motion";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function OrderSuccessPage() {
  const router = useRouter();
  const { id } = router.query;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // 📦 Fetch order details from Firestore
  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      try {
        const snap = await getDoc(doc(db, "orders", id));
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error("Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  // 🗓️ Helper: format delivery ETA (5–7 business days)
  const getDeliveryETA = (createdAt) => {
    if (!createdAt?.toDate) return "5–7 business days";
    const date = createdAt.toDate();
    date.setDate(date.getDate() + 6);
    return date.toLocaleDateString(undefined, { dateStyle: "medium" });
  };

  return (
    <section className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-3xl shadow-lg max-w-2xl w-full p-8 text-center border border-gray-100"
      >
        {/* ✅ Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12 }}
          className="flex justify-center mb-6"
        >
          <div className="w-20 h-20 flex items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 size={48} className="text-green-600" />
          </div>
        </motion.div>

        <h1 className="text-3xl font-serif font-bold text-green-600 mb-3">
          Order Confirmed!
        </h1>
        <p className="text-gray-600 mb-8 max-w-sm mx-auto">
          Thank you for shopping with us. Your jewellery is being prepared with care and will be on its way soon. ✨
        </p>

        {/* 🧾 Order Details Card */}
        <div className="bg-gray-50 border rounded-2xl p-5 mb-8 text-sm text-gray-700 text-left">
          {loading ? (
            <p className="text-center text-gray-500">Loading order details...</p>
          ) : order ? (
            <>
              <p className="mb-2">
                Order ID:{" "}
                <span className="font-semibold text-gray-900">
                  #{order.id.slice(0, 8)}
                </span>
              </p>
              <p className="mb-2">
                Status:{" "}
                <span className="font-semibold capitalize text-green-600">
                  {order.status}
                </span>
              </p>
              <p className="mb-4">
                Estimated Delivery:{" "}
                <span className="font-medium text-gray-900">
                  {getDeliveryETA(order.createdAt)}
                </span>
              </p>

              {/* 🛍️ Ordered Items */}
              <div className="border-t pt-4 space-y-3">
                {order.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image || item.imageUrl || item.images?.[0] || "/products/placeholder.png"}
                        alt={item.name}
                        className="w-12 h-12 rounded object-cover border"
                      />
                      <span>{item.name} × {item.qty}</span>
                    </div>
                    <span>₹{(item.price * item.qty).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>

              {/* 🏡 Address */}
              {order.customer && (
                <div className="mt-5 text-gray-600 text-sm">
                  <p className="font-medium text-gray-800 mb-1">Shipping to:</p>
                  <p>
                    {order.customer.name}, {order.customer.address},{" "}
                    {order.customer.city}, {order.customer.state} -{" "}
                    {order.customer.pincode}
                  </p>
                  {order.customer.phone && (
                    <p>📞 {order.customer.phone}</p>
                  )}
                </div>
              )}

              {/* 💰 Total */}
              <div className="mt-4 pt-4 border-t flex justify-between font-semibold text-base">
                <span>Total</span>
                <span>₹{order.total?.toLocaleString("en-IN")}</span>
              </div>
            </>
          ) : (
            <p className="text-center text-red-500">Order not found.</p>
          )}
        </div>

        {/* 🛍️ CTA Buttons */}
        {order && (
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href={`/order/${order.id}`}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-black text-white hover:bg-gray-800 transition"
            >
              Track Order
            </Link>
            <Link
              href="/shop"
              className="w-full sm:w-auto px-6 py-3 rounded-full border hover:bg-gray-50 transition"
            >
              Continue Shopping
            </Link>
          </div>
        )}

        {/* 🌸 Subtle Note */}
        <p className="text-xs text-gray-400 mt-6">
          You will receive a confirmation email shortly with shipping details.
        </p>
      </motion.div>
    </section>
  );
}

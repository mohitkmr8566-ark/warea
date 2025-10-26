// pages/order/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Head from "next/head";

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
    return <div className="text-center py-20 text-gray-500">Loading order details...</div>;
  }

  if (!order) {
    return <div className="text-center py-20 text-gray-500">Order not found or deleted.</div>;
  }

  const statusSteps = ["Pending", "Processing", "Shipped", "Out for Delivery", "Delivered"];
  const currentStep = statusSteps.indexOf(order.status || "Pending");

  return (
    <>
      <Head>
        <title>Order #{order.id.slice(0, 6)} — Warea</title>
      </Head>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Order Details</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-medium">#{order.id.slice(0, 6)}</p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${
                order.status === "Pending"
                  ? "text-yellow-600"
                  : order.status === "Delivered"
                  ? "text-green-600"
                  : "text-blue-600"
              }`}>
                {order.status || "Processing"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {order.createdAt?.toDate &&
                  order.createdAt.toDate().toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
              </p>
            </div>
          </div>

          {/* ✅ Tracking Progress */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-800">Tracking Progress</h3>
            <div className="relative flex items-center justify-between mb-6">
              {statusSteps.map((step, index) => (
                <div key={index} className="flex flex-col items-center flex-1 text-center">
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full border-2 text-sm font-medium transition-all duration-300
                      ${index <= currentStep
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 text-gray-400"
                      }`}
                  >
                    {index + 1}
                  </div>
                  <p
                    className={`text-xs mt-2 ${
                      index <= currentStep ? "text-green-600 font-medium" : "text-gray-400"
                    }`}
                  >
                    {step}
                  </p>
                </div>
              ))}
              <div className="absolute top-4 left-4 right-4 h-[2px] bg-gray-200 -z-10">
                <div
                  className="h-[2px] bg-green-500 transition-all duration-500"
                  style={{
                    width: `${(currentStep / (statusSteps.length - 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* ✅ Items */}
          <div>
            <h3 className="font-semibold mb-2">Items Ordered</h3>
            <div className="space-y-2 text-sm">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center border-b py-2">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image || item.imageUrl || item.images?.[0] || "/products/placeholder.png"}
                      alt={item.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                    <span>{item.name} × {item.qty}</span>
                  </div>
                  <span>₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping */}
          <div>
            <h3 className="font-semibold mb-2">Shipping Address</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
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
          <div className="border-t pt-3 flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span>₹{order.total}</span>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => router.push("/profile")}
            className="px-6 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-700"
          >
            ← Back to Orders
          </button>
        </div>
      </div>
    </>
  );
}

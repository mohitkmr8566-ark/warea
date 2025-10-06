// pages/order/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Head from "next/head";

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      try {
        const ref = doc(db, "orders", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        } else {
          setOrder(null);
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">Loading order details...</div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 text-gray-500">
        Order not found or deleted.
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Order #{order.id.slice(0, 6)} — Warea</title>
      </Head>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Order Details</h1>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-medium">#{order.id.slice(0, 6)}</p>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-medium ${
                  order.status === "Pending" ? "text-yellow-600" : "text-green-600"
                }`}
              >
                {order.status}
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

          {/* Items */}
          <div>
            <h3 className="font-semibold mb-2">Items Ordered</h3>
            <div className="space-y-1 text-sm">
              {order.items?.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between border-b py-1 text-gray-700"
                >
                  <span>
                    {item.name} × {item.qty}
                  </span>
                  <span>₹{item.price * item.qty}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Info */}
          <div>
            <h3 className="font-semibold mb-2">Shipping Address</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {order.customer?.name}, {order.customer?.address},{" "}
              {order.customer?.city}, {order.customer?.state} -{" "}
              {order.customer?.pincode}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Phone: {order.customer?.phone}
            </p>
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
            Back to Orders
          </button>
        </div>
      </div>
    </>
  );
}

// pages/admin/orders/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/store/AuthContext";
import { isAdmin } from "@/lib/admin";
import AdminLayout from "@/components/admin/AdminLayout";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function AdminOrderDetails() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔄 Real-time listener for single order
  useEffect(() => {
    if (!id || !user?.email || !isAdmin(user)) return;

    const ref = doc(db, "orders", id);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
          setLoading(false);
        } else {
          toast.error("Order not found");
          router.push("/admin/orders");
        }
      },
      (err) => {
        console.error("Order listener error:", err);
        toast.error("Failed to load order");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [id, user]);

  const handleStatusChange = async (newStatus) => {
    if (!isAdmin(user)) return toast.error("Unauthorized");

    try {
      const oldStatus = order?.status || null;
      if (oldStatus === newStatus) return toast("Status unchanged");

      const ref = doc(db, "orders", id);
      const changedAt = new Date().toISOString();

      await updateDoc(ref, {
        status: newStatus,
        statusHistory: arrayUnion({
          oldStatus,
          newStatus,
          changedBy: user.email,
          changedAt,
        }),
      });

      toast.success("Status updated ✅");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  // 🧾 PDF Invoice Generator
  const generateInvoice = () => {
    if (!order) return;

    const docPDF = new jsPDF("p", "mm", "a4");
    const pageWidth = docPDF.internal.pageSize.getWidth();

    // 🏷️ Logo + Title
    const logoPath = "/logo.png";
    const logoWidth = 25;
    const logoHeight = 25;

    // Try loading the logo from public folder
    const img = new Image();
    img.src = logoPath;
    img.onload = () => {
      docPDF.addImage(img, "PNG", 15, 12, logoWidth, logoHeight);

      docPDF.setFont("helvetica", "bold");
      docPDF.setFontSize(20);
      docPDF.text("WAREA JEWELLERY", 45, 25);
      docPDF.setFontSize(11);
      docPDF.setTextColor(100);
      docPDF.text("Official Invoice", 45, 32);

      // 🧾 Order info
      docPDF.setTextColor(0);
      docPDF.setFontSize(12);
      docPDF.text(`Invoice #: ${order.id}`, 15, 50);
      docPDF.text(
        `Date: ${
          order.createdAt?.toDate
            ? order.createdAt.toDate().toLocaleDateString()
            : "—"
        }`,
        pageWidth - 70,
        50
      );

      // 👤 Customer details
      docPDF.setFont("helvetica", "bold");
      docPDF.text("Bill To:", 15, 65);
      docPDF.setFont("helvetica", "normal");
      docPDF.text(order.customer?.name || "Customer", 15, 72);
      docPDF.text(order.userId || "", 15, 78);

      // 📦 Order items
      const tableBody = (order.items || []).map((item, i) => [
        i + 1,
        item.name || "Product",
        item.qty || 1,
        `₹${item.price}`,
        `₹${(item.qty || 1) * (item.price || 0)}`,
      ]);

      docPDF.autoTable({
        startY: 90,
        head: [["#", "Product", "Qty", "Price", "Total"]],
        body: tableBody,
        theme: "grid",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [22, 78, 99], textColor: 255 },
      });

      const finalY = docPDF.lastAutoTable.finalY + 10;
      docPDF.setFont("helvetica", "bold");
      docPDF.text(`Grand Total: ₹${order.total}`, pageWidth - 70, finalY);

      // 📜 Footer
      docPDF.setFont("helvetica", "italic");
      docPDF.setFontSize(10);
      docPDF.text(
        "Thank you for shopping with Warea! Visit us again ❤️",
        15,
        finalY + 20
      );

      docPDF.save(`Warea_Invoice_${order.id}.pdf`);
    };

    img.onerror = () => {
      toast.error("Logo could not be loaded. Make sure /public/logo.png exists.");
    };
  };

  if (!user || !isAdmin(user)) {
    return (
      <div className="text-center py-20 text-red-600 font-medium">
        ❌ Access Denied — Admins Only
      </div>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Order Details — Warea</title>
      </Head>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {loading ? (
          <p className="text-gray-500">Loading order details...</p>
        ) : !order ? (
          <p className="text-gray-500">Order not found.</p>
        ) : (
          <>
            {/* Header + Status Control */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold">
                  Order #{order.id.slice(0, 6)}
                </h1>
                <p className="text-sm text-gray-500">
                  Customer: {order.customer?.name} ({order.userId})
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={order.status || "Pending"}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option>Pending</option>
                  <option>Processing</option>
                  <option>Shipped</option>
                  <option>Out for Delivery</option>
                  <option>Delivered</option>
                </select>

                {/* 🧾 Download Invoice Button */}
                <button
                  onClick={generateInvoice}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  Download Invoice
                </button>
              </div>
            </div>

            {/* 🛍️ Items */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
              <h2 className="font-semibold mb-3">Items</h2>
              <div className="divide-y">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="flex justify-between py-2 items-center">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image || "/placeholder.jpg"}
                        alt={item.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          Qty: {item.qty || 1}
                        </p>
                      </div>
                    </div>
                    <div className="font-semibold text-gray-700">
                      ₹{item.price}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-right mt-3 font-semibold text-lg">
                Total: ₹{order.total}
              </div>
            </div>

            {/* 🕓 Status History */}
            <div className="bg-white shadow rounded-lg p-4">
              <h2 className="font-semibold mb-3">Status History</h2>
              {(order.statusHistory || []).length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {[...order.statusHistory]
                    .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
                    .map((h, i) => (
                      <li
                        key={i}
                        className="flex justify-between border-b pb-1 text-gray-700"
                      >
                        <span>
                          <b>{h.oldStatus}</b> → <b>{h.newStatus}</b>
                        </span>
                        <span className="text-gray-500">
                          {new Date(h.changedAt).toLocaleString()} •{" "}
                          <i>{h.changedBy}</i>
                        </span>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">
                  No status changes recorded.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

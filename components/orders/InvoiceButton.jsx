// ✅ components/orders/InvoiceButton.jsx
"use client";
import { useState } from "react";

export default function InvoiceButton({
  orderId,
  useClientPDF = false,   // Optional: still supports client-side PDF if ever needed
  variant = "primary",     // "primary" or "secondary" button style
  showIcon = true,         // Toggle 🧾 emoji
  label = "Download Invoice", // Custom label override
}) {
  const [loading, setLoading] = useState(false);

  // ✅ Method 1: Server-generated PDF
  const downloadServerInvoice = () => {
    if (!orderId) return;
    window.open(`/api/invoice/${orderId}`, "_blank");
  };

  // ✅ Method 2: Client-side PDF (optional, seldom used now)
  const downloadClientInvoice = async () => {
    setLoading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      const element = document.getElementById(`invoice-${orderId}`);
      if (!element) throw new Error("Invoice content not found");

      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
      pdf.save(`Warea-Invoice-${orderId}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = useClientPDF ? downloadClientInvoice : downloadServerInvoice;

  // ✅ Button style presets
  const baseClasses =
    "inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition rounded-full";
  const variants = {
    primary: "bg-yellow-500 hover:bg-yellow-600 text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 border",
    subtle: "text-gray-600 hover:text-gray-900",
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${baseClasses} ${variants[variant]} ${
        loading ? "opacity-70 cursor-not-allowed" : ""
      }`}
    >
      {loading ? "Generating..." : label}
      {showIcon && !loading && <span className="ml-2">🧾</span>}
    </button>
  );
}

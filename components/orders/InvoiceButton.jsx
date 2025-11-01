// components/orders/InvoiceButton.jsx
import { useState } from "react";

export default function InvoiceButton({ orderId, useClientPDF = false }) {
  const [loading, setLoading] = useState(false);

  // ✅ Method 1: Server-generated PDF (already in your project)
  const downloadServerInvoice = () => {
    window.open(`/api/invoice/${orderId}`, "_blank");
  };

  // ✅ Method 2: Client-side PDF (Lazy-load jsPDF + html2canvas)
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

  return (
    <button
      onClick={useClientPDF ? downloadClientInvoice : downloadServerInvoice}
      disabled={loading}
      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full text-sm font-medium transition"
    >
      {loading ? "Generating..." : "Download Invoice 🧾"}
    </button>
  );
}

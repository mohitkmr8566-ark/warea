export default function InvoiceButton({ orderId }) {
  const handleDownload = () => {
    window.open(`/api/invoice/${orderId}`, "_blank");
  };

  return (
    <button
      onClick={handleDownload}
      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full text-sm font-medium transition"
    >
      Download Invoice 🧾
    </button>
  );
}

// components/admin/ProductPreviewModal.jsx
import { X } from "lucide-react";

export default function ProductPreviewModal({ product, onClose }) {
  if (!product) return null;

  // 🖼️ Universal image fallback
  const imageSrc =
    product.image?.url ||
    product.image_url ||
    (Array.isArray(product.images) && product.images[0]?.url) ||
    product.image ||
    "/products/placeholder.png";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]">
      <div className="bg-white rounded-xl w-[90%] max-w-md shadow-xl relative p-5 animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          <X size={20} />
        </button>

        <img
          src={imageSrc}
          alt={product.title}
          className="w-full h-60 object-cover rounded-md mb-4 bg-gray-100"
        />

        <h2 className="text-xl font-semibold">{product.title}</h2>
        <p className="text-sm text-gray-600 mt-1">{product.category}</p>

        <div className="mt-3 text-lg font-semibold">₹{product.price}</div>
        <p className="text-gray-700 mt-2">{product.description}</p>

        <div className="mt-4 text-xs text-gray-500">
          Product ID: {product.id}
        </div>
      </div>
    </div>
  );
}

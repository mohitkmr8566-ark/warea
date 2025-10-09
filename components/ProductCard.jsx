"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/store/CartContext";
import { useWishlist } from "@/store/WishlistContext";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import toast from "react-hot-toast";
import ProductPreviewModal from "./ProductPreviewModal";

export default function ProductCard({ product }) {
  const { addItem } = useCart() || {};
  const { inWishlist, toggleItem } = useWishlist() || {};
  const wished = inWishlist?.(product.id);
  const [showPreview, setShowPreview] = useState(false);

  // 🔧 Modern image normalization
  const imageSrc =
    product.image?.url ||
    product.image_url ||
    (Array.isArray(product.images) && product.images[0]) ||
    product.image ||
    "/products/placeholder.png";

  const handleAddToCart = () => {
    addItem?.(product);
    toast.success(`${product.title} added to Cart 🛒`);
  };

  return (
    <>
      <div
        className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm
                   hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      >
        {/* Image Section */}
        <div className="relative overflow-hidden">
          <img
            src={imageSrc}
            alt={product.title}
            className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => (e.currentTarget.src = "/products/placeholder.png")}
          />

          {/* Wishlist Button */}
          <button
            onClick={() => toggleItem?.(product)}
            className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md border shadow-lg
              transition-all duration-200 ${
                wished
                  ? "bg-red-500 text-white"
                  : "bg-white/80 text-gray-700 hover:bg-gray-100"
              }`}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart size={18} fill={wished ? "white" : "none"} />
          </button>
        </div>

        {/* Details Section */}
        <div className="p-4 text-center">
          <h3 className="font-semibold text-base md:text-lg text-gray-900 truncate">
            {product.title}
          </h3>
          <p className="text-xs md:text-sm text-gray-500 capitalize">
            {product.material || product.category}
          </p>
          <p className="font-semibold text-gray-800 mt-1 text-sm md:text-base">
            ₹{product.price}
          </p>

          {/* Buttons */}
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-xs md:text-sm
                         hover:bg-gray-800 active:scale-95 transition-all"
            >
              <ShoppingCart size={16} /> Cart
            </button>

            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border text-xs md:text-sm
                         hover:bg-gray-100 active:scale-95 transition-all"
            >
              <Eye size={16} /> View
            </button>
          </div>
        </div>
      </div>

      {/* 🔍 Preview Modal */}
      {showPreview && (
        <ProductPreviewModal
          product={product}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}

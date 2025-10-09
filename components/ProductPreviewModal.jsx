"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Heart, X, Info } from "lucide-react";
import { useCart } from "@/store/CartContext";
import { useWishlist } from "@/store/WishlistContext";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ProductPreviewModal({ product, onClose }) {
  const { addItem } = useCart();
  const { inWishlist, toggleItem } = useWishlist();
  if (!product) return null;

  const wished = inWishlist?.(product.id);

  // 🧠 Universal image fallback
  const imageSrc =
    product.image?.url ||
    product.image_url ||
    (Array.isArray(product.images) && product.images[0]) ||
    product.image ||
    "/products/placeholder.png";

  const handleAddToCart = () => {
    addItem?.(product);
    toast.success(`${product.title} added to Cart ✅`);
  };

  const handleWishlist = () => {
    toggleItem?.(product);
    if (wished) toast.error(`${product.title} removed from Wishlist ❌`);
    else toast.success(`${product.title} added to Wishlist ❤️`);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative bg-white rounded-2xl shadow-2xl w-[90%] max-w-2xl max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-700 hover:text-black rounded-full bg-gray-100 hover:bg-gray-200 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Image Section */}
          <div className="w-full h-80 sm:h-[400px] bg-gray-50 flex items-center justify-center rounded-t-2xl overflow-hidden">
            <img
              src={imageSrc}
              alt={product.title}
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.src = "/products/placeholder.png")}
            />
          </div>

          {/* Details Section */}
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-gray-900">
              {product.title}
            </h2>
            {product.category && (
              <p className="text-sm text-gray-500 mt-1 capitalize">
                Category: {product.category}
              </p>
            )}

            <div className="mt-3 text-2xl font-bold text-gray-800">
              ₹{product.price}
            </div>

            {product.description && (
              <p className="text-gray-700 mt-4 leading-relaxed text-sm md:text-base">
                {product.description}
              </p>
            )}

            {/* Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-all active:scale-95"
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>

              <button
                onClick={handleWishlist}
                className={`flex items-center gap-2 border px-5 py-2.5 rounded-full transition-all active:scale-95 ${
                  wished
                    ? "bg-red-500 text-white border-red-500"
                    : "text-gray-800 hover:bg-gray-100 border-gray-300"
                }`}
              >
                <Heart
                  size={18}
                  fill={wished ? "white" : "none"}
                  strokeWidth={1.8}
                />
                {wished ? "Wishlisted" : "Add to Wishlist"}
              </button>

              <Link
                href={`/product/${product.id}`}
                className="flex items-center gap-2 px-5 py-2.5 border border-blue-600 text-blue-600 rounded-full hover:bg-blue-50 transition-all active:scale-95"
              >
                <Info size={18} /> Full Details
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

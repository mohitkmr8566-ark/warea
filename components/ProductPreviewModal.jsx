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
          className="relative bg-white rounded-2xl shadow-xl w-[90%] max-w-2xl max-h-[90vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-600 hover:text-black rounded-full bg-gray-100 hover:bg-gray-200 transition"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Image */}
          <div className="w-full h-80 sm:h-[400px] bg-gray-50 flex items-center justify-center rounded-t-2xl overflow-hidden">
            <img
              src={
                product.image?.url ||
                product.image ||
                product.images?.[0] ||
                "/products/placeholder.png"
              }
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Details */}
          <div className="p-6">
            <h2 className="text-2xl font-semibold">{product.title}</h2>
            {product.category && (
              <p className="text-sm text-gray-500 mt-1">
                Category: {product.category}
              </p>
            )}
            {product.material && (
              <p className="text-sm text-gray-500 mt-1">
                Material: {product.material}
              </p>
            )}

            <div className="mt-3 text-2xl font-bold">₹{product.price}</div>

            {product.description && (
              <p className="text-gray-700 mt-3 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 transition"
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>

              <button
                onClick={handleWishlist}
                className={`flex items-center gap-2 border px-5 py-2.5 rounded-lg transition ${
                  wished
                    ? "bg-red-500 text-white border-red-500"
                    : "text-gray-700 hover:bg-gray-100 border-gray-300"
                }`}
              >
                <Heart
                  size={18}
                  fill={wished ? "white" : "none"}
                  strokeWidth={1.8}
                />
                {wished ? "Wishlisted" : "Add to Wishlist"}
              </button>

              {/* View Full Page */}
              <Link
                href={`/product/${product.id}`}
                className="flex items-center gap-2 px-5 py-2.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
              >
                <Info size={18} /> View Full Details
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

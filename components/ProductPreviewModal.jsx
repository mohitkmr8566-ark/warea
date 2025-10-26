"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Heart, X, ChevronLeft, ChevronRight, Info } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useWishlist } from "@/store/WishlistContext";

export default function ProductPreviewModal({ product, onClose, onAddToCart, detailPath }) {
  const { inWishlist, toggleItem } = useWishlist() || {};
  if (!product) return null;

  // 🖼️ Prepare images array
  const images = useMemo(() => {
    if (Array.isArray(product.images) && product.images.length) return product.images;
    const fallback =
      product.image?.url || product.image_url || product.image || "/products/placeholder.png";
    return [fallback];
  }, [product]);

  const [idx, setIdx] = useState(0);
  const wished = inWishlist?.(product.id);

  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  const handleWishlist = () => {
    toggleItem?.(product);
    if (wished) toast.error(`${product.title} removed from Wishlist ❌`);
    else toast.success(`${product.title} added to Wishlist ❤️`);
  };

  // ⌨️ Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose} // 🖱️ Click outside closes modal
      >
        <motion.div
          className="relative bg-white rounded-2xl shadow-2xl w-[92%] max-w-3xl max-h-[90vh] overflow-hidden"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()} // prevent inside click from closing
        >
          {/* ✖ Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/60 hover:bg-black text-white hover:text-white shadow-lg transition-all duration-300"
            aria-label="Close"
            type="button"
          >
            <X size={20} />
          </button>

          {/* 🖼️ Image carousel with arrows */}
          <div className="relative w-full h-80 sm:h-[420px] bg-gray-50 flex items-center justify-center">
            <img
              key={idx}
              src={images[idx]}
              alt={`${product.title} ${idx + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.src = "/products/placeholder.png")}
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow"
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Small indicator dots */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`h-2 w-2 rounded-full ${
                        i === idx ? "bg-white" : "bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 📄 Product details */}
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  {product.title}
                </h2>
                {product.category && (
                  <p className="text-sm text-gray-500 mt-1 capitalize">
                    {product.category}
                  </p>
                )}
              </div>

              {/* ❤️ Wishlist toggle */}
              <button
                type="button"
                onClick={handleWishlist}
                className={`p-2 rounded-full border transition ${
                  wished ? "bg-red-500 text-white border-red-500" : "bg-white hover:bg-gray-100"
                }`}
                aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={18} fill={wished ? "white" : "none"} />
              </button>
            </div>

            <div className="mt-3 text-2xl font-bold text-gray-800">₹{product.price}</div>

            {product.description && (
              <p className="text-gray-700 mt-3 leading-relaxed text-sm md:text-base">
                {product.description}
              </p>
            )}

            {/* 🛒 Action buttons */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onAddToCart}
                className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-all active:scale-95"
              >
                <ShoppingCart size={18} />
                Add to Cart
              </button>

              {detailPath && (
                <Link
                  href={detailPath}
                  className="flex items-center gap-2 px-5 py-2.5 border border-blue-600 text-blue-600 rounded-full hover:bg-blue-50 transition-all active:scale-95"
                >
                  <Info size={18} />
                  Full Details
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

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

  // 🖼 Normalize images
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
    wished
      ? toast.error(`${product.title} removed from Wishlist ❌`)
      : toast.success(`${product.title} added to Wishlist ❤️`);
  };

  // ⌨️ Close on Esc key
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  // 🚫 Prevent background scroll when modal open
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (product) document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, [product]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* ⚪ Modal Box */}
        <motion.div
          className="
            relative bg-white rounded-2xl shadow-2xl
            w-[94vw] sm:w-[90%] max-w-3xl
            overflow-hidden overflow-x-hidden
            max-h-[90vh] flex flex-col
          "
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ❌ Close */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black text-white shadow-lg z-20"
          >
            <X size={20} />
          </button>

          {/* 🖼 Image Carousel */}
          <div className="relative w-full h-[320px] sm:h-[420px] bg-gray-50 overflow-hidden flex-shrink-0">
            <img
              key={idx}
              src={images[idx]}
              alt={`${product.title} Image ${idx + 1}`}
              className="w-full h-full object-contain"
              onError={(e) => (e.currentTarget.src = "/products/placeholder.png")}
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow"
                >
                  <ChevronRight size={20} />
                </button>

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

          {/* 📜 Details */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="w-full">
                <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 line-clamp-2">
                  {product.title}
                </h2>
                {product.category && (
                  <p className="text-sm text-gray-500 mt-1 capitalize">
                    {product.category}
                  </p>
                )}
              </div>

              {/* ❤️ Wishlist Button */}
              <button
                type="button"
                aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                onClick={handleWishlist}
                className={`p-2 rounded-full border transition ${
                  wished ? "bg-red-500 text-white border-red-500" : "bg-white hover:bg-gray-100"
                }`}
              >
                <Heart size={18} fill={wished ? "white" : "none"} />
              </button>
            </div>

            {/* 💰 Price */}
            <div className="mt-3 text-2xl font-bold text-gray-800">₹{product.price}</div>

            {/* 📝 Description */}
            {product.description && (
              <p className="text-gray-700 mt-3 text-sm sm:text-base leading-relaxed">
                {product.description}
              </p>
            )}

            {/* 🛒 Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onAddToCart}
                className="flex items-center justify-center gap-2 bg-black text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition active:scale-95 w-full sm:w-auto"
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>

              {detailPath && (
                <Link
                  href={detailPath}
                  className="flex items-center justify-center gap-2 border border-blue-600 text-blue-600 px-5 py-2.5 rounded-full hover:bg-blue-50 transition active:scale-95 w-full sm:w-auto"
                >
                  <Info size={18} /> Full Details
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import Link from "next/link";
import { useWishlist } from "@/store/WishlistContext";
import { useCart } from "@/store/CartContext";
import { ShoppingCart, Eye, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/* ✅ Utility — Normalize product images */
function toImageArray(p) {
  if (Array.isArray(p?.images)) {
    const arr = p.images
      .map((im) => (typeof im === "string" ? im : im?.url))
      .filter(Boolean);
    if (arr.length) return arr;
  }
  const candidates = [p?.image, p?.imageUrl, p?.imageURL, p?.image_url]
    .map((v) => (typeof v === "string" ? v : v?.url))
    .filter(Boolean);
  return candidates.length ? candidates : ["/products/placeholder.png"];
}

/* ✅ Image Hover Carousel */
function HoverCarousel({ sources, productLink }) {
  const safe = sources?.length ? sources : ["/products/placeholder.png"];
  const [idx, setIdx] = useState(0);
  const hoverRef = useRef(false);
  const timerRef = useRef(null);

  const next = () => setIdx((i) => (i + 1) % safe.length);
  const prev = () => setIdx((i) => (i - 1 + safe.length) % safe.length);

  useEffect(() => {
    if (!hoverRef.current || safe.length < 2) return;
    timerRef.current = setInterval(next, 1500);
    return () => clearInterval(timerRef.current);
  }, [safe.length, idx]);

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-gray-100"
      onMouseEnter={() => (hoverRef.current = true)}
      onMouseLeave={() => {
        hoverRef.current = false;
        if (timerRef.current) clearInterval(timerRef.current);
      }}
    >
      <Link href={productLink}>
        <img
          key={safe[idx]}
          src={safe[idx]}
          alt="Product"
          className="w-full h-full object-cover transition duration-500 ease-out cursor-pointer hover:scale-105"
          onError={(e) => (e.currentTarget.src = "/products/placeholder.png")}
        />
      </Link>

      {safe.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 border shadow hover:bg-white"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 border shadow hover:bg-white"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}

/* ===========================================================
   ✅ Main Wishlist Page Component
=========================================================== */
export default function WishlistPage() {
  const { wishlist = [], toggleItem, inWishlist } = useWishlist() || {};
  const { addItem } = useCart() || {};

  const handleAddToCart = (p) => {
    addItem?.(p);
    toast.success(`${p?.title ?? "Item"} added to Cart 🛒`);
  };

  return (
    <>
      {/* 🛍 Header */}
      <section className="bg-gradient-to-b from-gray-50 to-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-serif font-bold mb-3"
          >
            Your Wishlist
          </motion.h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto">
            Save your favorite jewellery and revisit them anytime.
          </p>
        </div>
      </section>

      {/* 📦 Wishlist Content */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {wishlist.length === 0 ? (
          <div className="text-center py-16">
            <img
              src="/empty-state.svg"
              alt="Empty Wishlist"
              className="mx-auto mb-6 w-40 opacity-70"
            />
            <h2 className="text-xl font-semibold mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Add your favorite pieces to see them here.</p>
            <Link
              href="/shop"
              className="inline-flex px-6 py-3 rounded-full bg-black text-white hover:bg-gray-800 transition"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 sm:gap-6">
            <AnimatePresence>
              {wishlist.map((p, i) => {
                const wished = inWishlist?.(p.id);
                const images = toImageArray(p);
                const detailPath = `/product/${encodeURIComponent(p.slug || p.id)}`;

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="group bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
                  >
                    {/* 🖼 Image + Heart Button */}
                    <div className="relative">
                      <HoverCarousel sources={images} productLink={detailPath} />
                      <button
                        onClick={() => {
                          toggleItem?.(p);
                          toast[wished ? "error" : "success"](
                            `${p.title} ${wished ? "removed from" : "added to"} Wishlist ${wished ? "❌" : "❤️"}`
                          );
                        }}
                        className={`absolute top-3 right-3 p-3 rounded-full shadow-md backdrop-blur-sm transition ${
                          wished ? "bg-red-500 text-white" : "bg-white/90 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Heart size={18} fill={wished ? "white" : "none"} />
                      </button>
                    </div>

                    {/* 📝 Info Section */}
                    <div className="p-4 text-center">
                      <Link href={detailPath}>
                        <h3 className="font-semibold text-sm md:text-base truncate hover:text-yellow-600 transition">
                          {p.title}
                        </h3>
                      </Link>
                      {(p.material || p.category) && (
                        <p className="text-xs md:text-sm text-gray-500">
                          {p.material || p.category}
                        </p>
                      )}
                      <p className="font-medium mt-1 text-sm md:text-base">
                        ₹{p.price}
                      </p>

                      {/* 🛒 Action Buttons */}
                      <div className="mt-4 flex justify-center gap-3">
                        <button
                          onClick={() => handleAddToCart(p)}
                          className="flex items-center gap-1 px-4 py-2 rounded-full bg-black text-white text-xs md:text-sm hover:bg-gray-800 transition"
                        >
                          <ShoppingCart size={16} /> Cart
                        </button>
                        <Link
                          href={detailPath}
                          className="flex items-center gap-1 px-4 py-2 rounded-full border text-xs md:text-sm hover:bg-gray-100 transition"
                        >
                          <Eye size={16} /> View
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  );
}

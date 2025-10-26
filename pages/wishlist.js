// pages/wishlist.js
import Link from "next/link";
import { useWishlist } from "@/store/WishlistContext";
import { useCart } from "@/store/CartContext";
import toast from "react-hot-toast";
import { ShoppingCart, Eye, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/** Normalize any product to an array of image URLs (strings). */
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

  if (candidates.length) return candidates;

  return ["/products/placeholder.png"];
}

/** 🖼️ Small, inline carousel with autoplay (on hover) + arrow navigation. */
function HoverCarousel({ sources, productLink, className = "" }) {
  const safe = sources?.length ? sources : ["/products/placeholder.png"];
  const [idx, setIdx] = useState(0);
  const hoverRef = useRef(false);
  const timerRef = useRef(null);

  const next = () => setIdx((i) => (i + 1) % safe.length);
  const prev = () => setIdx((i) => (i - 1 + safe.length) % safe.length);

  useEffect(() => {
    if (!hoverRef.current || safe.length < 2) return;
    timerRef.current = setInterval(next, 1400);
    return () => clearInterval(timerRef.current);
  }, [safe.length, idx]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gray-100 ${className}`}
      onMouseEnter={() => {
        hoverRef.current = true;
      }}
      onMouseLeave={() => {
        hoverRef.current = false;
        if (timerRef.current) clearInterval(timerRef.current);
      }}
    >
      {/* ✅ Wrap image inside Link */}
      <Link href={productLink}>
        <img
          key={safe[idx]}
          src={safe[idx]}
          alt="Product"
          className="w-full h-full object-cover transition-opacity duration-300 cursor-pointer hover:opacity-90"
          onError={(e) => (e.currentTarget.src = "/products/placeholder.png")}
        />
      </Link>

      {safe.length > 1 && (
        <>
          <button
            type="button"
            className="absolute left-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 border shadow hover:bg-white"
            onClick={prev}
            aria-label="Previous image"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 border shadow hover:bg-white"
            onClick={next}
            aria-label="Next image"
          >
            <ChevronRight size={16} />
          </button>
        </>
      )}
    </div>
  );
}

export default function WishlistPage() {
  const { wishlist = [], toggleItem, inWishlist } = useWishlist() || {};
  const { addItem } = useCart() || {};

  const handleAddToCart = (p) => {
    addItem?.(p);
    toast.success(`${p?.title ?? "Item"} added to Cart 🛒`);
  };

  return (
    <div className="page-container py-10">
      <h1 className="text-3xl font-bold mb-6">Your Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Your wishlist is empty.</p>
          <Link href="/shop" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {wishlist.map((p) => {
            const wished = inWishlist?.(p.id);
            const images = toImageArray(p);
            const detailPath = `/product/${encodeURIComponent(p.slug || p.id)}`;

            return (
              <div
                key={p.id}
                className="group border rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300"
              >
                {/* 🖼️ Image with carousel & link */}
                <div className="relative">
                  <HoverCarousel sources={images} productLink={detailPath} className="w-full aspect-square" />

                  {/* ❤️ Wishlist toggle */}
                  <button
                    onClick={() => {
                      toggleItem?.(p);
                      toast[wished ? "error" : "success"](
                        `${p.title} ${wished ? "removed from" : "added to"} Wishlist ${
                          wished ? "❌" : "❤️"
                        }`
                      );
                    }}
                    className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition
                      ${wished ? "bg-red-500 text-white" : "bg-white text-gray-700 hover:bg-red-100"}`}
                    aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart size={18} fill={wished ? "white" : "none"} />
                  </button>
                </div>

                {/* 📝 Content */}
                <div className="p-4 text-center">
                  <Link href={detailPath}>
                    <h3 className="font-semibold text-sm md:text-base truncate hover:text-blue-600 transition cursor-pointer">
                      {p.title}
                    </h3>
                  </Link>
                  {(p.material || p.category) && (
                    <p className="text-xs md:text-sm text-gray-500">
                      {p.material || p.category}
                    </p>
                  )}
                  <p className="font-medium mt-1">₹{p.price}</p>

                  {/* 🛍️ Actions */}
                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      onClick={() => handleAddToCart(p)}
                      className="flex items-center gap-1 px-3 py-2 rounded-full bg-gray-900 text-white text-xs md:text-sm hover:bg-gray-700 transition"
                    >
                      <ShoppingCart size={16} /> Cart
                    </button>

                    <Link
                      href={detailPath}
                      className="flex items-center gap-1 px-3 py-2 rounded-full border text-xs md:text-sm hover:bg-gray-100 transition"
                    >
                      <Eye size={16} /> View
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

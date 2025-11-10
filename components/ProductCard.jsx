"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import { useCart } from "@/store/CartContext";
import { useWishlist } from "@/store/WishlistContext";
import toast from "react-hot-toast";

const ProductPreviewModal = dynamic(() => import("./ProductPreviewModal"), {
  ssr: false,
});

// ✅ Safely extract usable image URLs from product data
function normalizeImages(product) {
  const rawArray = Array.isArray(product.images)
    ? product.images
        .map((img) => (typeof img === "string" ? img : img?.url))
        .filter(Boolean)
    : [];

  const primary =
    product.image?.url ||
    product.image_url ||
    rawArray[0] ||
    product.image ||
    "/products/placeholder.png";

  const secondary = rawArray[1] || null;

  return { primary, secondary, all: rawArray.length ? rawArray : [primary] };
}

function ProductCard({ product }) {
  const { addItem } = useCart();
  const { inWishlist, toggleItem } = useWishlist();
  const [showPreview, setShowPreview] = useState(false);

  const wished = inWishlist?.(product.id);
  const { primary, secondary, all } = useMemo(() => normalizeImages(product), [product]);

  const detailPath = useMemo(
    () => `/product/${encodeURIComponent(product.slug || product.id)}`,
    [product.slug, product.id]
  );

  const price = Number(product.price) || 0;
  const discount = Number(product.discountPercent) || 0;
  const originalPrice = discount > 0 ? Math.round(price / (1 - discount / 100)) : null;

  const handleAddToCart = useCallback(() => {
    addItem?.(product);
    toast.success(`${product.title} added to Cart 🛒`);
  }, [addItem, product]);

  const handleToggleWishlist = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleItem?.(product);
      toast[wished ? "error" : "success"](
        wished
          ? `${product.title} removed from Wishlist`
          : `${product.title} added to Wishlist ❤️`
      );
    },
    [toggleItem, product, wished]
  );

  return (
    <>
      <div className="group relative bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-500 w-full max-w-full min-w-0">

        {/* ✅ Discount Label */}
        {discount > 0 && (
          <span className="absolute top-3 left-3 z-20 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            -{discount}% Off
          </span>
        )}

        {/* ✅ Product Image */}
        <Link href={detailPath} className="block relative w-full" aria-label={`${product.title} details`}>
          <div className="aspect-square w-full overflow-hidden bg-gray-50 relative">
            {/* Primary Image */}
            <img
              src={`${primary}?auto=format,compress&w=480`}
              alt={product.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 group-hover:opacity-0"
            />
            {/* Secondary Image (hover swap) */}
            {secondary && (
              <img
                src={`${secondary}?auto=format,compress&w=480`}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-all duration-700 opacity-0 group-hover:opacity-100 scale-105"
              />
            )}
          </div>
        </Link>

        {/* ✅ Wishlist Button */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-pressed={!!wished}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-30 p-2 rounded-full border backdrop-blur-sm shadow-md transition ${
            wished ? "bg-red-500 text-white border-red-500" : "bg-white/90 hover:bg-gray-100 border-gray-200"
          }`}
        >
          <Heart size={18} fill={wished ? "white" : "none"} />
        </button>

        {/* ✅ Product Details */}
        <div className="p-2 sm:p-3 md:p-4 text-center">
          <Link href={detailPath}>
            <h3 className="font-medium text-sm md:text-lg text-gray-900 line-clamp-2 hover:text-yellow-600">
              {product.title}
            </h3>
            <p className="text-[11px] md:text-sm text-gray-500 capitalize">
              {product.material || product.category}
            </p>
          </Link>

          {/* ✅ Price Section */}
          <div className="mt-1 flex items-center justify-center gap-2">
            {originalPrice && (
              <span className="text-xs md:text-sm line-through text-gray-400">
                ₹{originalPrice}
              </span>
            )}
            <span className="text-sm md:text-xl font-semibold">₹{price}</span>
          </div>
        </div>

        {/* ✅ Hover Buttons */}
        <div className="hidden md:flex opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 justify-center gap-2 pb-4">
          <button
            onClick={handleAddToCart}
            className="px-4 py-1.5 bg-black text-white text-sm rounded-full flex items-center gap-1 hover:bg-gray-800"
          >
            <ShoppingCart size={16} /> Add
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="px-4 py-1.5 border text-sm rounded-full flex items-center gap-1 hover:bg-gray-100"
          >
            <Eye size={16} /> View
          </button>
        </div>
      </div>

      {/* ✅ Quick View Modal */}
      {showPreview && (
        <ProductPreviewModal
          product={{ ...product, images: all }}
          detailPath={detailPath}
          onAddToCart={handleAddToCart}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}

// ✅ Prevent unnecessary re-renders
export default React.memo(ProductCard, (prev, next) => prev.product.id === next.product.id);

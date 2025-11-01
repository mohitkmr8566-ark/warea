"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import { useCart } from "@/store/CartContext";
import { useWishlist } from "@/store/WishlistContext";
import toast from "react-hot-toast";

// ✅ Lazy load heavy modal
const ProductPreviewModal = dynamic(() => import("./ProductPreviewModal"), {
  ssr: false,
});

// ✅ Precompute images outside the component
function normalizeImages(product) {
  const imagesArray = Array.isArray(product.images)
    ? product.images.map((img) => (typeof img === "string" ? img : img?.url)).filter(Boolean)
    : [];

  const primary =
    product.image?.url ||
    product.image_url ||
    imagesArray[0] ||
    product.image ||
    "/products/placeholder.png";

  const secondary = imagesArray[1] || null;

  return {
    primary,
    secondary,
    all: imagesArray.length ? imagesArray : [primary],
  };
}

function ProductCard({ product }) {
  const { addItem } = useCart();
  const { inWishlist, toggleItem } = useWishlist();

  const [showPreview, setShowPreview] = useState(false);

  // ✅ Memoized image processing
  const { primary, secondary, all } = useMemo(() => normalizeImages(product), [product]);

  // ✅ Memoized detail link
  const detailPath = useMemo(
    () => `/product/${encodeURIComponent(product.slug || product.id)}`,
    [product.slug, product.id]
  );

  const wished = inWishlist?.(product.id);

  // ✅ Stable handlers
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
          ? `${product.title} removed from Wishlist ❌`
          : `${product.title} added to Wishlist ❤️`
      );
    },
    [toggleItem, product, wished]
  );

  return (
    <>
      <div className="group relative bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-out">
        {/* 🖼 Product Image */}
        <Link href={detailPath} className="relative block overflow-hidden">
          <div className="aspect-square w-full relative bg-gray-50">
            <img
              src={`${primary}?f_auto,q_auto,w=480`}
              alt={product.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-0"
              onError={(e) => (e.currentTarget.src = "/placeholder.png")}
            />

            {secondary && (
              <img
                src={`${secondary}?f_auto,q_auto,w=480`}
                alt={`${product.title} alternate`}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out scale-105 opacity-0 group-hover:opacity-100"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
          </div>
        </Link>

        {/* ❤️ Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-3 right-3 p-3 rounded-full backdrop-blur-sm border shadow-lg transition-all duration-300 z-10 ${
            wished ? "bg-red-500 text-white" : "bg-white/90 text-gray-700 hover:bg-gray-100"
          }`}
          aria-label="Add to wishlist"
        >
          <Heart size={18} fill={wished ? "white" : "none"} />
        </button>

        {/* 📄 Product Info */}
        <div className="p-4 text-center">
          <Link href={detailPath}>
            <h3 className="font-medium text-base md:text-lg text-gray-900 truncate hover:text-yellow-600 transition-colors duration-300">
              {product.title}
            </h3>
            <p className="text-xs md:text-sm text-gray-500 capitalize">
              {product.material || product.category}
            </p>
          </Link>
          <p className="font-semibold text-gray-900 mt-2 text-lg md:text-xl">₹{product.price}</p>
        </div>

        {/* 🛒 Action Buttons */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500">
          <button
            onClick={handleAddToCart}
            className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-black text-white text-sm hover:bg-gray-800"
          >
            <ShoppingCart size={16} /> Add
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-full border text-sm hover:bg-gray-100"
          >
            <Eye size={16} /> View
          </button>
        </div>
      </div>

      {/* 🔍 Modal Preview */}
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

// ✅ Prevent re-render unless product ID changes
export default React.memo(ProductCard, (prev, next) => prev.product.id === next.product.id);

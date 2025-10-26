"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/store/CartContext";
import { useWishlist } from "@/store/WishlistContext";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import toast from "react-hot-toast";
import ProductPreviewModal from "./ProductPreviewModal";

function normalizeImages(product) {
  const arr = Array.isArray(product.images)
    ? product.images
        .map((it) => (typeof it === "string" ? it : it?.url))
        .filter(Boolean)
    : [];

  const primary =
    product.image?.url ||
    product.image_url ||
    arr[0] ||
    product.image ||
    "/products/placeholder.png";

  const secondary = arr[1] || null;

  return {
    primary,
    secondary,
    all: arr.length ? arr : [primary].filter(Boolean),
  };
}

export default function ProductCard({ product }) {
  const { addItem } = useCart() || {};
  const { inWishlist, toggleItem } = useWishlist() || {};
  const wished = inWishlist?.(product.id);
  const [showPreview, setShowPreview] = useState(false);
  const [hovered, setHovered] = useState(false);

  const { primary, secondary, all } = normalizeImages(product);
  const detailPath = `/product/${encodeURIComponent(product.slug || product.id)}`;

  const handleAddToCart = () => {
    addItem?.(product);
    toast.success(`${product.title} added to Cart 🛒`);
  };

  return (
    <>
      <div
        className="group relative bg-white rounded-3xl border border-gray-100 overflow-hidden
          shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* 🖼️ Clickable Image Area */}
        <Link href={detailPath} className="relative block overflow-hidden z-0">
          <div className="aspect-square w-full relative bg-gray-50">
            {/* Primary Image */}
            <img
              src={primary}
              alt={product.title}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-700
                ${hovered ? "scale-110 opacity-0" : "opacity-100"}`}
              onError={(e) => (e.currentTarget.src = "/products/placeholder.png")}
            />

            {/* Secondary Image */}
            {secondary && (
              <img
                src={secondary}
                alt={`${product.title} alternate`}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700
                  ${hovered ? "opacity-100 scale-105" : "opacity-0"}`}
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
          </div>
        </Link>

        {/* ❤️ Wishlist Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleItem?.(product);
            toast[wished ? "error" : "success"](
              wished
                ? `${product.title} removed from Wishlist ❌`
                : `${product.title} added to Wishlist ❤️`
            );
          }}
          className={`absolute top-3 right-3 p-3 rounded-full backdrop-blur-sm border shadow-lg
                      transition-all duration-300 z-10 ${
                        wished
                          ? "bg-red-500 text-white"
                          : "bg-white/90 text-gray-700 hover:bg-gray-100"
                      }`}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={18} fill={wished ? "white" : "none"} />
        </button>

        {/* 🧾 Product Info */}
        <div className="p-5 text-center z-0">
          <Link href={detailPath}>
            <h3 className="font-semibold text-base md:text-lg text-gray-900 truncate hover:text-yellow-600 transition-colors duration-300">
              {product.title}
            </h3>
            <p className="text-xs md:text-sm text-gray-500 capitalize">
              {product.material || product.category}
            </p>
          </Link>
          <p className="font-semibold text-gray-800 mt-1 text-sm md:text-base">
            ₹{product.price}
          </p>
        </div>

        {/* 🛍️ Action Buttons (Not inside Link) */}
        <div
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 flex justify-center gap-3 transition-all duration-500 z-10
            ${hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-black text-white text-xs md:text-sm
                       hover:bg-gray-800 active:scale-95 transition-all"
          >
            <ShoppingCart size={16} /> Add
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPreview(true);
            }}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border text-xs md:text-sm
                       hover:bg-gray-100 active:scale-95 transition-all"
          >
            <Eye size={16} /> View
          </button>
        </div>

        {/* Subtle gradient overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-gray-900/5 to-transparent
            pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-700 z-0`}
        />
      </div>

      {/* 🔍 Product Quick Preview Modal */}
      {showPreview && (
        <ProductPreviewModal
          product={{ ...product, images: all }}
          onClose={() => setShowPreview(false)}
          onAddToCart={handleAddToCart}
          detailPath={detailPath}
        />
      )}
    </>
  );
}

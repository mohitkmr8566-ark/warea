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

// ✅ Normalize images
function normalizeImages(product) {
  const imagesArray = Array.isArray(product.images)
    ? product.images
        .map((img) => (typeof img === "string" ? img : img?.url))
        .filter(Boolean)
    : [];

  const primary =
    product.image?.url ||
    product.image_url ||
    imagesArray[0] ||
    product.image ||
    "/products/placeholder.png";

  const secondary = imagesArray[1] || null;
  return { primary, secondary, all: imagesArray.length ? imagesArray : [primary] };
}

function ProductCard({ product }) {
  const { addItem } = useCart();
  const { inWishlist, toggleItem } = useWishlist();
  const wished = inWishlist?.(product.id);
  const [showPreview, setShowPreview] = useState(false);

  const { primary, secondary, all } = useMemo(
    () => normalizeImages(product),
    [product]
  );

  const detailPath = useMemo(
    () => `/product/${encodeURIComponent(product.slug || product.id)}`,
    [product.slug, product.id]
  );

  // ✅ Price logic
  const price = Number(product.price) || 0;
  const discount = Number(product.discountPercent) || 0;
  const originalPrice =
    discount > 0 ? Math.round(price / (1 - discount / 100)) : null;

  // ✅ Add to cart
  const handleAddToCart = useCallback(() => {
    addItem?.(product);
    toast.success(`${product.title} added to Cart 🛒`);
  }, [addItem, product]);

  // ✅ Wishlist
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
      <div className="group relative bg-white rounded-3xl overflow-hidden border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-500">

        {/* ✅ Discount Label */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 bg-red-500 text-white text-[10px] sm:text-xs font-semibold px-2 py-1 rounded-full">
            -{discount}% Off
          </span>
        )}

        {/* ✅ Product Image */}
        <Link href={detailPath} className="block">
          <div className="w-full aspect-[3/4] overflow-hidden bg-gray-50 relative">
            <img
              src={`${primary}?f_auto,q_auto,w=480`}
              alt={product.title}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-0"
            />
            {secondary && (
              <img
                src={`${secondary}?f_auto,q_auto,w=480`}
                alt="alt-img"
                className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out scale-105 opacity-0 group-hover:opacity-100"
              />
            )}
          </div>
        </Link>

        {/* ✅ Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-2 right-2 sm:top-3 sm:right-3 p-2 rounded-full border backdrop-blur-sm shadow-md transition ${
            wished ? "bg-red-500 text-white" : "bg-white/90 hover:bg-gray-100"
          }`}
        >
          <Heart size={16} fill={wished ? "white" : "none"} />
        </button>

        {/* ✅ Product Info */}
        <div className="p-3 sm:p-4 text-center">
          <Link href={detailPath}>
            <h3 className="font-medium text-sm sm:text-base md:text-lg text-gray-900 line-clamp-2 hover:text-yellow-600 transition">
              {product.title}
            </h3>
            <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 capitalize line-clamp-1">
              {product.material || product.category}
            </p>
          </Link>

          {/* ✅ Price Display */}
          <div className="mt-1 sm:mt-2 flex items-center justify-center gap-1 sm:gap-2">
            {originalPrice && (
              <span className="text-xs sm:text-sm text-gray-400 line-through">
                ₹{originalPrice}
              </span>
            )}
            <span className="text-base sm:text-lg md:text-xl font-semibold">₹{price}</span>
          </div>
        </div>

        {/* ✅ Buttons (Mobile always visible, Desktop on hover) */}
        <div className="
          flex justify-center gap-2 pb-3
          sm:pb-4
          md:opacity-0 md:group-hover:opacity-100
          md:translate-y-2 md:group-hover:translate-y-0
          transition-all duration-500
        ">
          <button
            onClick={handleAddToCart}
            className="flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs sm:text-sm rounded-full hover:bg-gray-800"
          >
            <ShoppingCart size={14} /> Add
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1 px-3 py-1.5 border text-xs sm:text-sm rounded-full hover:bg-gray-100"
          >
            <Eye size={14} /> View
          </button>
        </div>
      </div>

      {/* ✅ Preview Modal */}
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

export default React.memo(ProductCard, (prev, next) => prev.product.id === next.product.id);

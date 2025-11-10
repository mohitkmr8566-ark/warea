// components/NoProducts.jsx

"use client";

import Link from "next/link";

export default function NoProducts() {
  return (
    <div className="w-full max-w-full overflow-x-hidden text-center py-20 px-4">
      {/* Image — responsive and fallback-safe */}
      <img
        src="/empty-box.png"
        alt="No products available"
        className="mx-auto w-28 md:w-32 h-auto opacity-80 mb-5 object-contain"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = "/empty-state.svg"; // ✅ fallback if empty-box.png missing
        }}
      />

      {/* Title */}
      <h2 className="text-lg md:text-xl font-semibold mb-2 text-gray-800">
        No products found
      </h2>

      {/* Description */}
      <p className="text-sm md:text-base text-gray-600 mb-4">
        Looks like there are no products in this category yet.
      </p>

      {/* CTA Button */}
      <Link
        href="/shop"
        className="inline-block bg-gray-900 text-white px-5 py-2 rounded-md
                   hover:bg-gray-700 transition text-sm md:text-base"
      >
        View All Products
      </Link>
    </div>
  );
}

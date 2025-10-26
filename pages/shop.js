"use client";

import { useRouter } from "next/router";
import Link from "next/link";
import { useMemo, useState } from "react";
import ProductGrid from "@/components/ProductGrid";

export default function ShopPage() {
  const router = useRouter();
  const selectedCategory =
    typeof router.query.cat === "string" ? router.query.cat.toLowerCase() : "all";

  const [sort, setSort] = useState("");

  // 🏷️ Static category list for now — you can also generate dynamically
  const categories = useMemo(
    () => ["all", "earrings", "bracelets", "necklaces", "giftsets"],
    []
  );

  const heading =
    selectedCategory && selectedCategory !== "all"
      ? `${selectedCategory[0].toUpperCase()}${selectedCategory.slice(1)} Collection`
      : "Shop All Products";

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-serif font-bold text-center mb-6">
        {heading}
      </h1>

      {/* 🏷️ Category Pills */}
      <div className="flex gap-3 flex-wrap justify-center mb-6">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          const href = cat === "all" ? "/shop" : `/shop?cat=${encodeURIComponent(cat)}`;
          return (
            <Link
              key={cat}
              href={href}
              className={`px-4 py-2 rounded-full text-sm border transition ${
                isActive
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
              }`}
              shallow
            >
              {cat[0].toUpperCase() + cat.slice(1)}
            </Link>
          );
        })}
      </div>

      {/* ↕️ Sort Dropdown */}
      <div className="flex justify-end mb-6">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="">Sort By</option>
          <option value="low-to-high">Price: Low to High</option>
          <option value="high-to-low">Price: High to Low</option>
        </select>
      </div>

      {/* 🛍️ Product Grid */}
      <ProductGrid category={selectedCategory} sort={sort} />
    </div>
  );
}

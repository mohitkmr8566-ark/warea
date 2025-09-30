import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

import ProductGrid from "@/components/ProductGrid";
import NoProducts from "@/components/NoProducts";
import { PRODUCTS } from "@/lib/products";

export default function ShopPage() {
  const router = useRouter();
  const selectedCategory =
    typeof router.query.cat === "string" ? router.query.cat.toLowerCase() : "";

  const [sort, setSort] = useState("");

  // Build category list from product data
  const categories = useMemo(() => {
    const set = new Set(
      PRODUCTS.map((p) => (p.category || "").toLowerCase()).filter(Boolean)
    );
    return ["all", ...Array.from(set).sort()];
  }, []);

  // Filter by category
  const filtered = useMemo(() => {
    if (!selectedCategory || selectedCategory === "all") return PRODUCTS;
    return PRODUCTS.filter(
      (p) => (p.category || "").toLowerCase() === selectedCategory
    );
  }, [selectedCategory]);

  // Apply sorting
  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sort === "low-to-high") copy.sort((a, b) => a.price - b.price);
    if (sort === "high-to-low") copy.sort((a, b) => b.price - a.price);
    return copy;
  }, [filtered, sort]);

  const heading =
    selectedCategory && selectedCategory !== "all"
      ? `${selectedCategory[0].toUpperCase()}${selectedCategory.slice(1)} Collection`
      : "Shop All Products";

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Heading */}
      <h1 className="text-3xl font-serif font-bold text-center mb-6">{heading}</h1>

      {/* Category Pills */}
      <div className="flex gap-3 flex-wrap justify-center mb-6">
        {categories.map((cat) => {
          const isActive =
            (!selectedCategory && cat === "all") ||
            (selectedCategory || "all") === cat;
          const href = cat === "all" ? "/shop" : `/shop?cat=${encodeURIComponent(cat)}`;
          return (
            <Link
              key={cat}
              href={href}
              className={`px-4 py-2 rounded-full text-sm border transition
                ${isActive ? "bg-gray-900 text-white border-gray-900" : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"}
              `}
              shallow
            >
              {cat[0].toUpperCase() + cat.slice(1)}
            </Link>
          );
        })}
      </div>

      {/* Sort Dropdown */}
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

      {/* Product Results */}
      {sorted.length > 0 ? (
            <ProductGrid products={sorted} />
      ) : (
        <NoProducts />
      )}
    </div>
  );
}

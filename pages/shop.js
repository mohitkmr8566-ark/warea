"use client";

import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import ProductGrid from "@/components/ProductGrid";
import { motion } from "framer-motion";

export default function ShopPage() {
  const router = useRouter();
  const selectedCategory =
    typeof router.query.cat === "string" ? router.query.cat.toLowerCase() : "all";

  const [sort, setSort] = useState("");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);

  const categories = useMemo(
    () => ["all", "earrings", "bracelets", "necklaces", "giftsets"],
    []
  );

  const heading =
    selectedCategory && selectedCategory !== "all"
      ? `${selectedCategory[0].toUpperCase()}${selectedCategory.slice(1)} Collection`
      : "Shop All Products";

  const pageTitle =
    selectedCategory && selectedCategory !== "all"
      ? `${heading} | Warea Jewellery`
      : "Shop Jewellery Online | Warea";

  const pageDesc = `Discover exquisite ${
    selectedCategory === "all" ? "" : selectedCategory
  } jewellery at Warea. Explore premium anti-tarnish collections at affordable prices.`;

  const handlePriceChange = (e) => {
    const [min, max] = e.target.value.split("-").map(Number);
    setPriceRange([min, max]);
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta name="twitter:card" content="summary_large_image" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: pageTitle,
              description: pageDesc,
              url: typeof window !== "undefined" ? window.location.href : "",
            }),
          }}
        />
      </Head>

      {/* 🛍️ Hero Header Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-serif font-bold mb-3"
          >
            {heading}
          </motion.h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto">
            Discover timeless designs and modern elegance, crafted to elevate your everyday style.
          </p>
        </div>
      </section>

      {/* 🏷️ Category Pills */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-3 flex-wrap justify-center border-b border-gray-100">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          const href = cat === "all" ? "/shop" : `/shop?cat=${encodeURIComponent(cat)}`;
          return (
            <Link
              key={cat}
              href={href}
              className={`px-5 py-2.5 rounded-full text-sm border transition font-medium tracking-wide
              ${
                isActive
                  ? "bg-black text-white border-black shadow-md"
                  : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
              }`}
              shallow
            >
              {cat[0].toUpperCase() + cat.slice(1)}
            </Link>
          );
        })}
      </div>

      {/* 🧭 Filter & Sort Bar */}
      <div className="sticky top-[64px] bg-white/80 backdrop-blur-md border-b border-gray-100 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-4">
          {/* Filter Toggle (Mobile) */}
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className="lg:hidden flex items-center gap-2 border px-4 py-2 rounded-md text-sm bg-gray-50 hover:bg-gray-100 transition"
          >
            <SlidersHorizontal size={16} />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>

          {/* Price Filter */}
          <div
            className={`flex gap-3 items-center transition-all ${
              showFilters ? "block" : "hidden lg:flex"
            }`}
          >
            <label className="text-sm font-medium text-gray-600">Price:</label>
            <select
              value={`${priceRange[0]}-${priceRange[1]}`}
              onChange={handlePriceChange}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="0-10000">All Prices</option>
              <option value="0-500">Under ₹500</option>
              <option value="500-1000">₹500 – ₹1000</option>
              <option value="1000-2000">₹1000 – ₹2000</option>
              <option value="2000-5000">₹2000 – ₹5000</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="ml-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="">Sort By</option>
              <option value="popular">Most Popular</option>
              <option value="low-to-high">Price: Low to High</option>
              <option value="high-to-low">Price: High to Low</option>
              <option value="new-arrivals">New Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🛒 Product Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-7xl mx-auto px-4 py-10"
      >
        <ProductGrid
          category={selectedCategory}
          sort={sort}
          minPrice={priceRange[0]}
          maxPrice={priceRange[1]}
        />
      </motion.div>
    </>
  );
}

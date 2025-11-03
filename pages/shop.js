// pages/shop.js
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useMemo, useCallback } from "react";
import { SlidersHorizontal } from "lucide-react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const ProductGrid = dynamic(() => import("@/components/ProductGrid"), {
  ssr: false,
});

// Normalize helper
const normalize = (str = "") => str.toString().trim().toLowerCase();

export default function ShopPage({ initialProducts, baseUrlFromServer }) {
  const router = useRouter();

  // normalize category from URL
  const selectedCategory = useMemo(() => {
    const cat = router.query.cat;
    return typeof cat === "string" ? normalize(cat) : "all";
  }, [router.query.cat]);

  const [sort, setSort] = useState("");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);

  const categories = useMemo(
    () => ["all", "earrings", "bracelets", "necklaces", "rings", "giftsets"],
    []
  );

  // ✅ (restored) helper to modify query params shallowly
  const updateQuery = useCallback(
    (key, value) => {
      const newQuery = { ...router.query };
      if (!value || value === "all") delete newQuery[key];
      else newQuery[key] = value;
      router.push({ pathname: "/shop", query: newQuery }, undefined, {
        shallow: true,
      });
    },
    [router]
  );

  const handlePriceChange = useCallback((e) => {
    const [min, max] = e.target.value.split("-").map(Number);
    setPriceRange([min, max]);
    // example use: updateQuery("price", e.target.value);
  }, []);

  const heading = useMemo(
    () =>
      selectedCategory !== "all"
        ? `${selectedCategory[0].toUpperCase()}${selectedCategory.slice(1)} Collection`
        : "Shop All Products",
    [selectedCategory]
  );

  const baseUrl =
    baseUrlFromServer ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const pageTitle =
    selectedCategory !== "all"
      ? `${heading} | Warea Jewellery`
      : "Shop Jewellery Online | Warea";

  const pageDesc = `Discover exquisite ${
    selectedCategory === "all" ? "" : selectedCategory
  } jewellery at Warea. Explore premium handcrafted anti-tarnish collections at affordable prices.`;

  const itemListJson = useMemo(() => {
    const sample = initialProducts.slice(0, 5) || [];
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: heading,
      numberOfItems: sample.length,
      itemListElement: sample.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${baseUrl}/product/${p.id}`,
        name: p.title,
      })),
    });
  }, [initialProducts, heading, baseUrl]);

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link
          rel="canonical"
          href={`${baseUrl}/shop${
            selectedCategory !== "all" ? `?cat=${selectedCategory}` : ""
          }`}
        />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:image" content={`${baseUrl}/logo.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: itemListJson }}
        />
      </Head>

      {/* Heading */}
      <section className="bg-gradient-to-b from-gray-50 to-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-serif font-bold"
          >
            {heading}
          </motion.h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto">
            Discover timeless designs and modern elegance.
          </p>
        </div>
      </section>

      {/* Category row */}
      <div className="max-w-7xl mx-auto px-4 py-6 border-b border-gray-100">
        <div className="flex gap-3 flex-nowrap overflow-x-auto scrollbar-hide justify-center">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <Link
                key={cat}
                href={cat === "all" ? "/shop" : `/shop?cat=${cat}`}
                shallow
                className={`px-5 py-2.5 whitespace-nowrap rounded-full text-sm border transition font-medium ${
                  isActive
                    ? "bg-black text-white border-black shadow-md"
                    : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Filters / Sorting */}
      <div className="sticky top-[64px] bg-white/80 backdrop-blur-md border-b z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center gap-4">
          <button
            onClick={() => setShowFilters((p) => !p)}
            className="lg:hidden flex items-center gap-2 border px-4 py-2 rounded-md text-sm"
          >
            <SlidersHorizontal size={16} />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>

          <div className={`${showFilters ? "block" : "hidden lg:flex"} items-center gap-3`}>
            <label className="text-sm font-medium">Price:</label>
            <select
              value={`${priceRange[0]}-${priceRange[1]}`}
              onChange={handlePriceChange}
              className="border px-3 py-2 text-sm rounded-md"
            >
              <option value="0-10000">All Prices</option>
              <option value="0-500">Under ₹500</option>
              <option value="500-1000">₹500 – ₹1000</option>
              <option value="1000-2000">₹1000 – ₹2000</option>
              <option value="2000-5000">₹2000 – ₹5000</option>
            </select>
          </div>

          <div className="ml-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border px-3 py-2 text-sm rounded-md"
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

      {/* Product Grid */}
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
          initialProducts={initialProducts}
        />
      </motion.div>
    </>
  );
}

// ✅ Fixed getServerSideProps: convert Firestore Timestamp → millis for JSON
export async function getServerSideProps() {
  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    const products = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : null,
      };
    });

    return {
      props: {
        initialProducts: products,
        baseUrlFromServer: process.env.NEXT_PUBLIC_BASE_URL || "",
      },
    };
  } catch (err) {
    console.error("❌ SSR Error (Shop):", err);
    return { props: { initialProducts: [], baseUrlFromServer: "" } };
  }
}

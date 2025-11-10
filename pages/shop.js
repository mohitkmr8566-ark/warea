// pages/shop.js
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

const ProductGrid = dynamic(() => import("@/components/ProductGrid"), { ssr: false });

// Normalize helper
const normalize = (str = "") => str.toString().trim().toLowerCase();

export default function ShopPage({ initialProducts = [], baseUrlFromServer = "" }) {
  const router = useRouter();

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

  const handlePriceChange = (e) => {
    const [min, max] = e.target.value.split("-").map(Number);
    setPriceRange([min, max]);
  };

  // Proper baseUrl
  const baseUrl =
    baseUrlFromServer || (typeof window !== "undefined" ? window.location.origin : "");

  // SEO Title & Description
  const heading =
    selectedCategory !== "all"
      ? `${selectedCategory[0].toUpperCase()}${selectedCategory.slice(1)} Collection`
      : "Shop All Products";

  const pageTitle =
    selectedCategory !== "all" ? `${heading} | Warea Jewellery` : "Shop Jewellery Online | Warea";

  const pageDesc = `Discover premium ${
    selectedCategory === "all" ? "" : selectedCategory
  } jewellery at Warea Creations. Modern, elegant & handcrafted.`;

  const itemListJson = useMemo(() => {
    const sample = initialProducts.slice(0, 5);
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
          href={`${baseUrl}/shop${selectedCategory !== "all" ? `?cat=${selectedCategory}` : ""}`}
        />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:url" content={`${baseUrl}/shop`} />
        <meta property="og:image" content={`${baseUrl}/logo.png`} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: itemListJson }} />
      </Head>

      {/* ✅ Main Wrapper */}
      <main className="w-full min-w-0 bg-[#fdfaf5]">

        {/* ✅ HERO */}
        <section className="border-b w-full">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl font-serif font-bold break-words"
            >
              {heading}
            </motion.h1>
            <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto mt-2">
              Discover timeless designs and modern elegance.
            </p>
          </div>
        </section>

        {/* ✅ CATEGORY TABS */}
        <div className="border-b bg-[#fdfaf5] w-full">
          <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-4">
            <div className="-mx-4 sm:mx-0">
              <div className="flex overflow-x-auto no-scrollbar gap-3 whitespace-nowrap px-4 pr-8">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <Link
                      key={cat}
                      href={cat === "all" ? "/shop" : `/shop?cat=${cat}`}
                      shallow
                      className={`px-5 py-2.5 rounded-full text-sm border font-medium flex-shrink-0 ${
                        isActive
                          ? "bg-black text-white border-black shadow"
                          : "bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ✅ FILTER SECTION (Sticky) */}
        <div className="sticky top-[56px] sm:top-[64px] bg-white/90 backdrop-blur border-b z-30 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowFilters((p) => !p)}
              className="lg:hidden flex items-center gap-2 border px-4 py-2 rounded-md text-sm bg-white"
            >
              <SlidersHorizontal size={16} />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>

            {showFilters && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Price:</label>
                <select
                  value={`${priceRange[0]}-${priceRange[1]}`}
                  onChange={(e) => {
                    const [min, max] = e.target.value.split("-").map(Number);
                    setPriceRange([min, max]);
                  }}
                  className="border px-3 py-2 text-sm rounded-md bg-white"
                >
                  <option value="0-10000">All Prices</option>
                  <option value="0-500">Under ₹500</option>
                  <option value="500-1000">₹500–₹1000</option>
                  <option value="1000-2000">₹1000–₹2000</option>
                  <option value="2000-5000">₹2000–₹5000</option>
                </select>
              </div>
            )}

            <div className="ml-auto">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border px-3 py-2 text-sm rounded-md bg-white"
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

        {/* ✅ PRODUCT GRID SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8"
        >
          {initialProducts.length === 0 ? (
            <div className="min-h-[40vh] grid place-items-center">
              <h3 className="text-lg font-semibold text-gray-800">No products found</h3>
            </div>
          ) : (
            <ProductGrid
              category={selectedCategory}
              sort={sort}
              minPrice={priceRange[0]}
              maxPrice={priceRange[1]}
              initialProducts={initialProducts}
            />
          )}
        </motion.div>
      </main>
    </>
  );
}

// ✅ SSR — Safe Data
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
        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : null,
      };
    });

    return {
      props: {
        initialProducts: products,
        baseUrlFromServer: process.env.NEXT_PUBLIC_BASE_URL || "",
      },
    };
  } catch (err) {
    console.error("❌ SSR Error (shop page):", err);
    return {
      props: { initialProducts: [], baseUrlFromServer: "" },
    };
  }
}

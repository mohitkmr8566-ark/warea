// pages/search.js

import { useState, useEffect, useMemo, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";

const popularTags = ["Earrings", "Necklace", "Rings", "Gold", "Bridal"];
const SSR_ENABLED = process.env.NEXT_PUBLIC_SSR_SEARCH === "true";

const debounce = (fn, delay = 400) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/* ==========================
   CLIENT-SIDE VERSION (fallback when SSR is disabled)
========================== */
function ClientSearch() {
  const router = useRouter();
  const initialQuery = router.query.q ? String(router.query.q) : "";

  const [queryText, setQueryText] = useState(initialQuery);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState("");

  // Detect domain for SEO links
  useEffect(() => {
    const url =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    setBaseUrl(url);
  }, []);

  // Fetch once
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setProducts(list);
      } catch (err) {
        console.error("🔥 Search fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Sync search to URL (SEO-friendly)
  const syncUrl = useCallback(
    debounce((value) => {
      if (value.trim()) {
        router.push(`/search?q=${encodeURIComponent(value)}`, undefined, {
          shallow: true,
        });
      } else {
        router.push(`/search`, undefined, { shallow: true });
      }
    }, 500),
    [router]
  );

  const handleQueryChange = (value) => {
    setQueryText(value);
    syncUrl(value);
  };

  const filtered = useMemo(() => {
    const q = (queryText || "").trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => {
      const name = (p.title || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      return name.includes(q) || desc.includes(q) || category.includes(q);
    });
  }, [queryText, products]);

  const handleTagClick = (tag) => handleQueryChange(tag);
  const hasSearched = queryText.trim().length > 0;

  const pageTitle = hasSearched
    ? `Search results for “${queryText}” | Warea`
    : "Search Jewellery | Warea";

  const pageDesc = hasSearched
    ? `Discover ${filtered.length} result${filtered.length !== 1 ? "s" : ""} for “${queryText}” at Warea. Explore handcrafted jewellery.`
    : "Find your perfect jewellery at Warea. Search by name, metal, or design.";

  const searchSchema = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    name: pageTitle,
    description: pageDesc,
    url:
      typeof window !== "undefined"
        ? window.location.href
        : `${baseUrl}/search`,
  };

  const itemListSchema =
    hasSearched && filtered.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListOrder: "https://schema.org/ItemListOrderAscending",
          numberOfItems: filtered.length,
          itemListElement: filtered.slice(0, 20).map((p, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${baseUrl}/product/${p.id}`,
            name: p.title || "Jewellery Item",
          })),
        }
      : null;

  return (
    <SearchLayout
      queryText={queryText}
      setQueryText={handleQueryChange}
      filtered={filtered}
      hasSearched={hasSearched}
      pageTitle={pageTitle}
      pageDesc={pageDesc}
      searchSchema={searchSchema}
      itemListSchema={itemListSchema}
      loading={loading}
      handleTagClick={handleTagClick}
    />
  );
}

/* ==========================
   SSR-ENABLED VERSION (when SSR_ENABLED === true)
========================== */
function SSRSearch({ initialProducts, initialQuery, baseUrlFromServer }) {
  const router = useRouter();

  const [queryText, setQueryText] = useState(initialQuery || "");
  const [baseUrl, setBaseUrl] = useState(baseUrlFromServer || "");
  // We already have products on first paint; no loading spinner needed for SSR
  const products = initialProducts || [];

  useEffect(() => {
    if (!baseUrl) {
      const url =
        process.env.NEXT_PUBLIC_BASE_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");
      setBaseUrl(url);
    }
  }, [baseUrl]);

  const syncUrl = useCallback(
    debounce((value) => {
      if (value.trim()) {
        router.push(`/search?q=${encodeURIComponent(value)}`, undefined, {
          shallow: true,
        });
      } else {
        router.push(`/search`, undefined, { shallow: true });
      }
    }, 500),
    [router]
  );

  const handleQueryChange = (value) => {
    setQueryText(value);
    syncUrl(value);
  };

  const filtered = useMemo(() => {
    const q = (queryText || "").trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => {
      const name = (p.title || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      return name.includes(q) || desc.includes(q) || category.includes(q);
    });
  }, [queryText, products]);

  const handleTagClick = (tag) => handleQueryChange(tag);
  const hasSearched = queryText.trim().length > 0;

  const pageTitle = hasSearched
    ? `Search results for “${queryText}” | Warea`
    : "Search Jewellery | Warea";

  const pageDesc = hasSearched
    ? `Discover ${filtered.length} result${filtered.length !== 1 ? "s" : ""} for “${queryText}” at Warea. Explore handcrafted jewellery.`
    : "Find your perfect jewellery at Warea. Search by name, metal, or design.";

  const searchSchema = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    name: pageTitle,
    description: pageDesc,
    url:
      typeof window !== "undefined"
        ? window.location.href
        : `${baseUrl}/search`,
  };

  const itemListSchema =
    hasSearched && filtered.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListOrder: "https://schema.org/ItemListOrderAscending",
          numberOfItems: filtered.length,
          itemListElement: filtered.slice(0, 20).map((p, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${baseUrl}/product/${p.id}`,
            name: p.title || "Jewellery Item",
          })),
        }
      : null;

  return (
    <SearchLayout
      queryText={queryText}
      setQueryText={handleQueryChange}
      filtered={filtered}
      hasSearched={hasSearched}
      pageTitle={pageTitle}
      pageDesc={pageDesc}
      searchSchema={searchSchema}
      itemListSchema={itemListSchema}
      loading={false}
      handleTagClick={handleTagClick}
    />
  );
}

/* ==========================
   Shared UILayout (unchanged visually)
========================== */
function SearchLayout({
  queryText,
  setQueryText,
  filtered,
  hasSearched,
  pageTitle,
  pageDesc,
  searchSchema,
  itemListSchema,
  loading,
  handleTagClick,
}) {
  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(searchSchema) }}
        />
        {itemListSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
          />
        )}
      </Head>

      <main className="w-full min-h-screen">
        <div className="w-full bg-white border-b border-gray-200 shadow-sm">
          <div className="page-container py-10 text-center">
            <div className="flex justify-center mb-4">
              <Search className="text-gray-400 mr-2 mt-1" size={22} />
              <h1 className="text-3xl font-bold">Find Your Perfect Jewellery</h1>
            </div>

            <div className="max-w-2xl mx-auto mt-6">
              <SearchBar
                value={queryText}
                onChange={setQueryText}
                placeholder="Search by name, material or category..."
              />
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="px-4 py-1.5 rounded-full text-sm border text-gray-700 hover:bg-gray-100"
                >
                  {tag}
                </button>
              ))}
            </div>

            {hasSearched && (
              <p className="mt-3 text-gray-500 text-sm">
                Showing results for <span className="font-semibold">“{queryText}”</span>
              </p>
            )}
          </div>
        </div>

        <div className="page-container py-14">
          {loading ? (
            <p className="text-center text-gray-500">Loading products...</p>
          ) : !hasSearched ? (
            <div className="text-center text-gray-500 py-20">
              <Search size={50} className="mb-4 opacity-40" />
              <p className="text-lg">Start typing to search our collections ✨</p>
            </div>
          ) : filtered.length > 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {filtered.length} item{filtered.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                <AnimatePresence>
                  {filtered.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ProductCard product={p} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-20">
              <Search size={42} className="mb-3 opacity-40" />
              <p>No products match this search.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

/* ==========================
   Smart default export wrapper
========================== */
export default function Wrapper(props) {
  if (props.ssrDisabled) return <ClientSearch />;
  return (
    <SSRSearch
      initialProducts={props.initialProducts}
      initialQuery={props.initialQuery}
      baseUrlFromServer={props.baseUrlFromServer}
    />
  );
}

/* ==========================
   Firestore SSR
========================== */
export async function getServerSideProps(context) {
  if (!SSR_ENABLED) {
    return { props: { ssrDisabled: true } };
  }

  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const products = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    const initialQuery = context.query.q ? String(context.query.q) : "";
    const baseUrlFromServer = process.env.NEXT_PUBLIC_BASE_URL || "";

    return {
      props: {
        ssrDisabled: false,
        initialProducts: products,
        initialQuery,
        baseUrlFromServer,
      },
    };
  } catch (err) {
    console.error("❌ SSR Search Error:", err);
    return {
      props: {
        ssrDisabled: false,
        initialProducts: [],
        initialQuery: context.query.q ? String(context.query.q) : "",
        baseUrlFromServer: process.env.NEXT_PUBLIC_BASE_URL || "",
      },
    };
  }
}

import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";

const popularTags = ["Earrings", "Necklace", "Rings", "Gold", "Bridal"];
const SSR_ENABLED = process.env.NEXT_PUBLIC_SSR_SEARCH === "true";

/* ==========================
   CLIENT-SIDE VERSION
========================== */
function ClientSearch() {
  const [queryText, setQueryText] = useState("");
  const [products, setProducts] = useState([]);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    const url =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    setBaseUrl(url);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(list);
      } catch (err) {
        console.error("🔥 Search fetch error:", err);
      }
    };
    fetchProducts();
  }, []);

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

  const handleTagClick = (tag) => setQueryText(tag);
  const hasSearched = queryText.trim().length > 0;

  const pageTitle = hasSearched
    ? `Search results for “${queryText}” | Warea`
    : "Search Jewellery | Warea";
  const pageDesc = hasSearched
    ? `Discover ${filtered.length} result${filtered.length !== 1 ? "s" : ""} for “${queryText}” at Warea. Explore handcrafted, anti-tarnish jewellery designed for elegance.`
    : "Find your perfect jewellery at Warea. Search by name, metal, or design and explore our beautiful anti-tarnish collections.";

  const searchSchema = {
    "@context": "https://schema.org",
    "@type": "SearchResultsPage",
    name: pageTitle,
    description: pageDesc,
    url: typeof window !== "undefined" ? window.location.href : `${baseUrl}/search`,
  };

  const itemListSchema =
    hasSearched && filtered.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Search results for “${queryText}”`,
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
      setQueryText={setQueryText}
      filtered={filtered}
      hasSearched={hasSearched}
      pageTitle={pageTitle}
      pageDesc={pageDesc}
      searchSchema={searchSchema}
      itemListSchema={itemListSchema}
      handleTagClick={handleTagClick}
    />
  );
}

/* ==========================
   SSR VERSION (Production)
========================== */
export async function getServerSideProps(context) {
  if (!SSR_ENABLED) {
    return { props: { ssrDisabled: true } };
  }

  const queryText = context.query.q ? context.query.q.toLowerCase() : "";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://warea.in";

  try {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const products = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : null,
        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : null,
        images:
          data.images?.map((i) =>
            typeof i === "string" ? { url: i } : i
          ) || (data.image_url ? [{ url: data.image_url }] : []),
      };
    });

    const filtered = queryText
      ? products.filter((p) => {
          const name = (p.title || "").toLowerCase();
          const desc = (p.description || "").toLowerCase();
          const category = (p.category || "").toLowerCase();
          return (
            name.includes(queryText) ||
            desc.includes(queryText) ||
            category.includes(queryText)
          );
        })
      : [];

    const pageTitle = queryText
      ? `Search results for “${queryText}” | Warea`
      : "Search Jewellery | Warea";
    const pageDesc = queryText
      ? `Discover ${filtered.length} result${filtered.length !== 1 ? "s" : ""} for “${queryText}” at Warea. Explore handcrafted, anti-tarnish jewellery designed for elegance.`
      : "Find your perfect jewellery at Warea. Search by name, metal, or design and explore our beautiful anti-tarnish collections.";

    const searchSchema = {
      "@context": "https://schema.org",
      "@type": "SearchResultsPage",
      name: pageTitle,
      description: pageDesc,
      url: `${baseUrl}/search${queryText ? `?q=${encodeURIComponent(queryText)}` : ""}`,
    };

    const itemListSchema =
      queryText && filtered.length > 0
        ? {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `Search results for “${queryText}”`,
            itemListOrder: "https://schema.org/ItemListOrderAscending",
            numberOfItems: filtered.length,
            itemListElement: filtered.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${baseUrl}/product/${p.id}`,
              name: p.title || "Jewellery Item",
            })),
          }
        : null;

    return {
      props: {
        ssrDisabled: false,
        products,
        queryText,
        pageTitle,
        pageDesc,
        searchSchema,
        itemListSchema,
      },
    };
  } catch (err) {
    console.error("❌ SSR Search Error:", err);
    return {
      props: {
        ssrDisabled: false,
        products: [],
        queryText,
        pageTitle: "Search Jewellery | Warea",
        pageDesc:
          "Find your perfect jewellery at Warea. Search by name, metal, or design and explore our beautiful anti-tarnish collections.",
      },
    };
  }
}

/* ==========================
   Shared Layout Component
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
  handleTagClick,
}) {
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
              <h1 className="text-3xl font-bold tracking-tight">
                Find Your Perfect Jewellery
              </h1>
            </div>

            <div className="max-w-2xl mx-auto mt-6">
              <SearchBar
                value={queryText}
                onChange={setQueryText}
                placeholder="Search by name, material, design or category..."
              />
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="px-4 py-1.5 rounded-full text-sm border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
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
          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
              <Search size={50} className="mb-4 opacity-40" />
              <p className="text-lg font-medium">
                Start typing to explore our collections ✨
              </p>
              <p className="text-sm opacity-70 mt-1">
                Try popular searches like “Earrings” or “Necklace”.
              </p>
            </div>
          ) : filtered.length > 0 ? (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                <AnimatePresence>
                  {filtered.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.35 }}
                    >
                      <div className="scale-90 sm:scale-95 md:scale-90 lg:scale-90 hover:scale-95 transition-transform duration-300">
                        <div className="[&>div>div:first-child]:h-[220px] sm:[&>div>div:first-child]:h-[250px] md:[&>div>div:first-child]:h-[270px]">
                          <ProductCard product={p} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500">
              <Search size={42} className="mb-3 opacity-40" />
              <p className="text-lg font-medium">No products match your search.</p>
              <p className="text-sm opacity-70 mt-1">Try a different keyword or tag above.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function Wrapper(props) {
  return props.ssrDisabled ? <ClientSearch /> : <SearchLayout {...props} />;
}

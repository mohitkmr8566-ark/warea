"use client";

import { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";

const popularTags = ["Earrings", "Necklace", "Rings", "Gold", "Bridal"];

export default function SearchPage() {
  const [queryText, setQueryText] = useState("");
  const [products, setProducts] = useState([]);

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

  const handleTagClick = (tag) => {
    setQueryText(tag);
  };

  const hasSearched = queryText.trim().length > 0;

  return (
    <>
      <Head>
        <title>Search — Warea</title>
      </Head>

      <main className="w-full min-h-screen">
        {/* 🪄 Top Search Section */}
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

            {/* ✨ Popular Tags */}
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

        {/* 🧼 Results Section */}
        <div className="page-container py-14">
          {!hasSearched ? (
            // 🪄 Empty state when no search yet
            <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
              <Search size={50} className="mb-4 opacity-40" />
              <p className="text-lg font-medium">Start typing to explore our collections ✨</p>
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
                      {/* ✨ Shrink card + control image height */}
                      <div className="scale-90 sm:scale-95 md:scale-90 lg:scale-90 xl:scale-90 hover:scale-95 transition-transform duration-300">
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

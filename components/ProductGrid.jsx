"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  startAfter,
  limit as fbLimit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProductCard from "./ProductCard";
import { motion, AnimatePresence } from "framer-motion";

const PAGE_SIZE = 12;

export default function ProductGrid({
  onlyFeatured = false,
  category = "",
  sort = "",
  minPrice = 0,
  maxPrice = Infinity,
}) {
  const [products, setProducts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef(null);

  const fetchInitial = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "products"),
        orderBy("createdAt", "desc"),
        fbLimit(PAGE_SIZE)
      );

      const snap = await getDocs(q);
      let items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLastDoc(snap.docs[snap.docs.length - 1] || null);

      // 🧠 Apply filters client-side
      items = applyFilters(items);
      setProducts(items);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error("❌ Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, "products"),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        fbLimit(8)
      );

      const snap = await getDocs(q);
      let items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      items = applyFilters(items);
      setProducts((prev) => [...prev, ...items]);
      setHasMore(snap.docs.length > 0);
    } catch (err) {
      console.error("❌ Error loading more products:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const applyFilters = (items) => {
    // ✅ Fixed: now uses `isFeatured` instead of `featured`
    if (onlyFeatured) {
      items = items.filter((p) => p.isFeatured === true);
    }

    // ✅ Category filter
    if (category && category !== "all") {
      items = items.filter(
        (p) => (p.category || "").toLowerCase() === category.toLowerCase()
      );
    }

    // ✅ Price filter
    items = items.filter((p) => {
      const price = Number(p.price) || 0;
      return price >= minPrice && price <= maxPrice;
    });

    // ✅ Sort
    if (sort === "low-to-high") {
      items.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sort === "high-to-low") {
      items.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sort === "popular") {
      items.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    } else if (sort === "new-arrivals") {
      items.sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
      );
    }

    // ✅ Always exclude inactive products (universal)
    items = items.filter((p) => p.isActive !== false);

    return items;
  };

  // 🔥 Infinite scroll observer
  const lastProductRef = useCallback(
    (node) => {
      if (loadingMore || !hasMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loadingMore, hasMore]
  );

  useEffect(() => {
    fetchInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyFeatured, category, sort, minPrice, maxPrice]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800"
          ></div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <img
          src="/empty-state.svg"
          alt="No products"
          className="mx-auto mb-4 w-32 opacity-70"
        />
        <p className="text-lg font-medium">No products found</p>
        <p className="text-sm text-gray-400 mt-1">
          Try adjusting your filters or browse another category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
      <AnimatePresence>
        {products.map((p, idx) => {
          const isLast = idx === products.length - 1;
          return (
            <motion.div
              key={p.id}
              ref={isLast ? lastProductRef : null}
              className="p-1 sm:p-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProductCard product={p} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

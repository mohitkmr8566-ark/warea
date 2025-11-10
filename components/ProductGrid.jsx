"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
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

const DEFAULT_PAGE_SIZE = 12;

function ProductGrid({
  onlyFeatured = false,
  category = "",
  sort = "",
  minPrice = 0,
  maxPrice = Infinity,
  pageSize = DEFAULT_PAGE_SIZE,
  initialProducts,
}) {
  const [products, setProducts] = useState(initialProducts || []);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(!initialProducts?.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const mountedRef = useRef(true);
  const observerRef = useRef(null);

  const normalize = (str = "") =>
    typeof str === "string" ? str.trim().toLowerCase() : "";

  const applyFilters = useCallback(
    (items) => {
      let filtered = items;

      if (onlyFeatured) filtered = filtered.filter((p) => p.isFeatured);

      if (category && category !== "all") {
        const cat = normalize(category);
        filtered = filtered.filter(
          (p) => normalize(p.category) === cat || normalize(p.category) + "s" === cat
        );
      }

      filtered = filtered.filter((p) => {
        const price = +p.price || 0;
        return price >= minPrice && price <= maxPrice;
      });

      if (sort === "low-to-high") {
        filtered = [...filtered].sort((a, b) => (a.price || 0) - (b.price || 0));
      } else if (sort === "high-to-low") {
        filtered = [...filtered].sort((a, b) => (b.price || 0) - (a.price || 0));
      } else if (sort === "popular") {
        filtered = [...filtered].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      } else if (sort === "new-arrivals") {
        filtered = [...filtered].sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
        );
      }

      return filtered.filter((p) => p.isActive !== false);
    },
    [onlyFeatured, category, sort, minPrice, maxPrice]
  );

  const featuredFallback = useCallback(async (limitSize) => {
    const q = query(
      collection(db, "products"),
      orderBy("createdAt", "desc"),
      fbLimit(limitSize)
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  }, []);

  const dedupeMerge = useCallback((prev, next) => {
    const map = new Map(prev.map((p) => [p.id, p]));
    next.forEach((item) => map.set(item.id, item));
    return [...map.values()];
  }, []);

  const fetchInitial = useCallback(async () => {
    setLoading(!products.length);
    try {
      const q1 = query(
        collection(db, "products"),
        orderBy("createdAt", "desc"),
        fbLimit(pageSize)
      );
      const snap = await getDocs(q1);
      let items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      let filtered = applyFilters(items);

      if (onlyFeatured && filtered.length === 0) {
        const latest = await featuredFallback(pageSize);
        filtered = applyFilters(latest);
      }

      if (!mountedRef.current) return;
      setProducts(filtered);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === pageSize);
    } catch (err) {
      console.error("❌ Error loading products:", err);
    } finally {
      mountedRef.current && setLoading(false);
    }
  }, [applyFilters, featuredFallback, onlyFeatured, pageSize, products.length]);

  const loadMore = useCallback(async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const q1 = query(
        collection(db, "products"),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        fbLimit(Math.max(8, Math.floor(pageSize / 1.5)))
      );
      const snap = await getDocs(q1);
      const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const filtered = applyFilters(items);

      if (!mountedRef.current) return;
      setProducts((prev) => dedupeMerge(prev, filtered));
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length > 0);
    } catch (err) {
      console.error("❌ Error loading more:", err);
    } finally {
      mountedRef.current && setLoadingMore(false);
    }
  }, [lastDoc, loadingMore, applyFilters, dedupeMerge, pageSize]);

  const lastProductRef = useCallback(
    (node) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node || !hasMore) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && !loadingMore) loadMore();
        },
        { root: null, rootMargin: "600px 0px", threshold: 0 }
      );

      observerRef.current.observe(node);
    },
    [hasMore, loadingMore, loadMore]
  );

  useEffect(() => {
    mountedRef.current = true;
    fetchInitial();
    return () => {
      mountedRef.current = false;
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [fetchInitial]);

  // ✅ Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-64 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // ✅ No products
  if (!products.length) {
    return (
      <div className="text-center py-20">
        <img src="/empty-state.svg" alt="No products" className="w-32 mx-auto opacity-75 mb-4" />
        <p className="text-gray-600 font-medium">No products found</p>
      </div>
    );
  }

  // ✅ Product grid — FIXED 2-column layout on mobile
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-2">
        {products.map((product, idx) => {
          const isLast = idx === products.length - 1;
          return (
            <motion.div
              key={product.id}
              ref={isLast ? lastProductRef : null}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="min-w-0"
            >
              <ProductCard product={product} />
            </motion.div>
          );
        })}
      </div>

      {loadingMore && (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
        </div>
      )}
    </div>
  );
}

export default React.memo(ProductGrid);

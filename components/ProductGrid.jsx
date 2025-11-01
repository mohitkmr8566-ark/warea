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
  pageSize = DEFAULT_PAGE_SIZE, // optional override
}) {
  const [products, setProducts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const mountedRef = useRef(true);
  const observerRef = useRef(null);
  const lastElRef = useRef(null);
  const nextPageWarmRef = useRef(null); // for idle warm-up

  // ---------- helpers ----------
  const applyFilters = useCallback(
    (items) => {
      let filtered = items;

      if (onlyFeatured) filtered = filtered.filter((p) => p.isFeatured === true);

      if (category && category !== "all") {
        const cat = String(category).toLowerCase();
        filtered = filtered.filter(
          (p) => (p.category || "").toLowerCase() === cat
        );
      }

      filtered = filtered.filter((p) => {
        const price = Number(p.price) || 0;
        return price >= minPrice && price <= maxPrice;
      });

      if (sort === "low-to-high") {
        filtered = [...filtered].sort((a, b) => (a.price || 0) - (b.price || 0));
      } else if (sort === "high-to-low") {
        filtered = [...filtered].sort((a, b) => (b.price || 0) - (a.price || 0));
      } else if (sort === "popular") {
        filtered = [...filtered].sort(
          (a, b) => (b.popularity || 0) - (a.popularity || 0)
        );
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

  const dedupeMerge = useCallback((prev, next) => {
    const map = new Map(prev.map((p) => [p.id, p]));
    for (const item of next) {
      map.set(item.id, item);
    }
    return Array.from(map.values());
  }, []);

  // ---------- fetch initial ----------
  const fetchInitial = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "products"),
        orderBy("createdAt", "desc"),
        fbLimit(pageSize)
      );
      const snap = await getDocs(q);
      let items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      items = applyFilters(items);

      if (!mountedRef.current) return;
      setProducts(items);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === pageSize);

      // best-effort pre-warm the next page in idle time
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        window.requestIdleCallback(
          () => {
            nextPageWarmRef.current = { qStart: snap.docs[snap.docs.length - 1] || null };
          },
          { timeout: 1000 }
        );
      }
    } catch (err) {
      console.error("❌ Error fetching products:", err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [applyFilters, pageSize]);

  // ---------- load more ----------
  const loadMore = useCallback(async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, "products"),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        fbLimit(Math.max(8, Math.floor(pageSize / 1.5))) // small chunk for smoother scroll
      );
      const snap = await getDocs(q);
      let items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      items = applyFilters(items);

      if (!mountedRef.current) return;
      setProducts((prev) => dedupeMerge(prev, items));
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length > 0);
    } catch (err) {
      console.error("❌ Error loading more products:", err);
    } finally {
      if (mountedRef.current) setLoadingMore(false);
    }
  }, [lastDoc, loadingMore, pageSize, applyFilters, dedupeMerge]);

  // ---------- observer ----------
  const lastProductRef = useCallback(
    (node) => {
      // disconnect old
      if (observerRef.current) observerRef.current.disconnect();

      if (!node || !hasMore) return;
      lastElRef.current = node;

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting && !loadingMore) {
          loadMore();
        }
      });

      observerRef.current.observe(node);
    },
    [hasMore, loadingMore, loadMore]
  );

  // mount / unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  // refetch when any filter/sort changes
  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  // ---------- UI states ----------
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-64 rounded-xl bg-gray-200 dark:bg-gray-800" />
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
          loading="lazy"
          decoding="async"
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
              transition={{ duration: 0.25 }}
            >
              <ProductCard product={p} />
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* subtle loader when fetching more */}
      {loadingMore && (
        <div className="col-span-full flex justify-center py-6">
          <div className="h-6 w-6 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
        </div>
      )}
    </div>
  );
}

export default React.memo(ProductGrid);

"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProductCard from "./ProductCard";

export default function ProductGrid({ onlyFeatured = false, category = "", sort = "" }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(collection(db, "products"), orderBy("createdAt", "desc"));

    if (onlyFeatured) {
      q = query(
        collection(db, "products"),
        where("featured", "==", true),
        orderBy("createdAt", "desc")
      );
    }

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        let items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // 🧭 Filter by category
        if (category && category !== "all") {
          items = items.filter(
            (p) => (p.category || "").toLowerCase() === category.toLowerCase()
          );
        }

        // ↕️ Sort
        if (sort === "low-to-high") {
          items.sort((a, b) => a.price - b.price);
        } else if (sort === "high-to-low") {
          items.sort((a, b) => b.price - a.price);
        }

        setProducts(items);
        setLoading(false);
      },
      (error) => {
        console.error("❌ Error fetching products in real-time:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [onlyFeatured, category, sort]);

  if (loading) {
    return (
      <div className="text-center text-gray-500 py-10">
        Loading products...
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">
        No products found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
      {products.map((p) => (
        <div key={p.id} className="p-1 sm:p-2">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}

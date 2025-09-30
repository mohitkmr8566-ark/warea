import { useMemo, useState } from "react";
import Head from "next/head";
import SearchBar from "../components/SearchBar";
import ProductCard from "../components/ProductCard";
import { PRODUCTS } from "../lib/products";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) return PRODUCTS;
    return PRODUCTS.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      return name.includes(q) || desc.includes(q) || category.includes(q);
    });
  }, [query]);

  return (
    <>
      <Head>
        <title>Search — Warea</title>
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Search Products</h1>

        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Search by name, metal, design or category..."
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
          {filtered.length ? (
            filtered.map((p) => <ProductCard key={p.id} product={p} />)
          ) : (
            <p className="col-span-full text-center text-gray-500">
              No products match your search.
            </p>
          )}
        </div>
      </main>
    </>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import NoProducts from "@/components/NoProducts";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { PRODUCTS } from "@/lib/products"; // local demo fallback

export default function ShopPage() {
  const router = useRouter();
  const selectedCategory =
    typeof router.query.cat === "string" ? router.query.cat.toLowerCase() : "";

  const [fireProducts, setFireProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("");

  // 🔥 Live Firestore sync
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => {
          const data = d.data();

          // 🧠 Normalize image fields for all cases
          const imageSrc =
            data.image?.url ||
            data.image_url ||
            (Array.isArray(data.images) && data.images[0]) ||
            data.image ||
            "/products/placeholder.png";

          return {
            id: d.id,
            title: data.title || "Untitled Product",
            price: Number(data.price) || 0,
            category: data.category || "",
            description: data.description || "",
            material: data.material || "",
            image: imageSrc,
            images:
              data.images ||
              (data.image_url
                ? [data.image_url]
                : data.image
                ? [data.image.url]
                : []),
          };
        });

        setFireProducts(arr);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading products:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  // ✅ Combine Firestore + Local static fallback
  const allProducts = useMemo(() => {
    const localMapped = PRODUCTS.map((p) => ({
      id: p.id || Math.random().toString(36).slice(2),
      title: p.title,
      price: p.price,
      category: p.category || "",
      description: p.description || "",
      material: p.material || "",
      image:
        (Array.isArray(p.images) && p.images[0]) ||
        p.image ||
        p.imageUrl ||
        "/products/placeholder.png",
      images: p.images || [],
    }));

    return [...fireProducts, ...localMapped];
  }, [fireProducts]);

  // 🏷️ Build dynamic category filters
  const categories = useMemo(() => {
    const set = new Set(
      allProducts.map((p) => (p.category || "").toLowerCase()).filter(Boolean)
    );
    return ["all", ...Array.from(set).sort()];
  }, [allProducts]);

  // 🔍 Filter by category
  const filtered = useMemo(() => {
    if (!selectedCategory || selectedCategory === "all") return allProducts;
    return allProducts.filter(
      (p) => (p.category || "").toLowerCase() === selectedCategory
    );
  }, [allProducts, selectedCategory]);

  // ↕️ Sort
  const sorted = useMemo(() => {
    const copy = [...filtered];
    if (sort === "low-to-high") copy.sort((a, b) => a.price - b.price);
    if (sort === "high-to-low") copy.sort((a, b) => b.price - a.price);
    return copy;
  }, [filtered, sort]);

  const heading =
    selectedCategory && selectedCategory !== "all"
      ? `${selectedCategory[0].toUpperCase()}${selectedCategory.slice(1)} Collection`
      : "Shop All Products";

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-serif font-bold text-center mb-6">
        {heading}
      </h1>

      {/* Category Pills */}
      <div className="flex gap-3 flex-wrap justify-center mb-6">
        {categories.map((cat) => {
          const isActive =
            (!selectedCategory && cat === "all") ||
            (selectedCategory || "all") === cat;
          const href = cat === "all" ? "/shop" : `/shop?cat=${encodeURIComponent(cat)}`;
          return (
            <Link
              key={cat}
              href={href}
              className={`px-4 py-2 rounded-full text-sm border transition ${
                isActive
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
              }`}
              shallow
            >
              {cat[0].toUpperCase() + cat.slice(1)}
            </Link>
          );
        })}
      </div>

      {/* Sort Dropdown */}
      <div className="flex justify-end mb-6">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="">Sort By</option>
          <option value="low-to-high">Price: Low to High</option>
          <option value="high-to-low">Price: High to Low</option>
        </select>
      </div>

      {/* Product Grid */}
      {loading ? (
        <p className="text-center text-gray-500">Loading products...</p>
      ) : sorted.length > 0 ? (
        <ProductGrid products={sorted} />
      ) : (
        <NoProducts />
      )}
    </div>
  );
}

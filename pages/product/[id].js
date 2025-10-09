"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { PRODUCTS } from "@/lib/products";
import { useCart } from "@/store/CartContext";
import { useWishlist } from "@/store/WishlistContext";
import { ShoppingCart, Heart, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const { addItem } = useCart();
  const { inWishlist, toggleItem } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch product from Firestore or local fallback
  useEffect(() => {
    if (!id) return;

    const loadProduct = async () => {
      setLoading(true);
      try {
        const ref = doc(db, "products", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();

          setProduct({
            id: snap.id,
            title: data.title || "Untitled Product",
            description: data.description || "",
            category: data.category || "",
            material: data.material || "",
            price: data.price || 0,
            images:
              data.images ||
              (data.image_url
                ? [data.image_url]
                : data.image
                ? [data.image.url]
                : []),
          });
        } else {
          // fallback to local demo
          const local = PRODUCTS.find((p) => p.id === id);
          setProduct(local || null);
        }
      } catch (error) {
        console.error("Error loading product:", error);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gray-500 text-lg">
        Loading product details...
      </div>
    );

  if (!product)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold mb-3">Product Not Found</h1>
        <Link
          href="/shop"
          className="text-blue-600 hover:text-blue-700 transition"
        >
          Back to Shop
        </Link>
      </div>
    );

  const mainImage =
    (Array.isArray(product.images) && product.images[0]) ||
    "/products/placeholder.png";

  const wished = inWishlist?.(product.id);

  // 🛒 Actions
  const handleAddToCart = () => {
    addItem(product);
    toast.success(`${product.title} added to Cart ✅`);
  };

  const handleWishlist = () => {
    toggleItem(product);
    if (wished)
      toast.error(`${product.title} removed from Wishlist ❌`);
    else toast.success(`${product.title} added to Wishlist ❤️`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Back Button */}
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft size={16} /> Back to Shop
      </Link>

      {/* Product Section */}
      <div className="grid md:grid-cols-2 gap-10 items-start">
        {/* 🖼️ Image Gallery */}
        <div className="relative group rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white">
          <img
            src={mainImage}
            alt={product.title}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
        </div>

        {/* 🧾 Product Info */}
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-serif font-semibold text-gray-900 tracking-tight">
            {product.title}
          </h1>

          {product.category && (
            <p className="text-sm uppercase tracking-wide text-yellow-600 font-medium">
              {product.category}
            </p>
          )}

          <p className="text-lg text-gray-600">{product.material}</p>

          <div className="text-3xl font-bold text-gray-900">
            ₹{product.price.toLocaleString("en-IN")}
          </div>

          {product.description && (
            <p className="text-gray-700 leading-relaxed border-t border-gray-200 pt-4">
              {product.description}
            </p>
          )}

          {/* 🛍️ Buttons */}
          <div className="flex flex-wrap gap-3 pt-4">
            <button
              onClick={handleAddToCart}
              className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg shadow-md hover:bg-gray-800 transition-all"
            >
              <ShoppingCart size={18} /> Add to Cart
            </button>

            <button
              onClick={handleWishlist}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg border text-sm font-medium transition-all ${
                wished
                  ? "bg-red-500 border-red-500 text-white hover:bg-red-600"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Heart
                size={18}
                fill={wished ? "white" : "none"}
                strokeWidth={1.8}
              />
              {wished ? "Wishlisted" : "Add to Wishlist"}
            </button>
          </div>

          {/* ✅ Category / Tags */}
          <div className="pt-6 text-sm text-gray-500 border-t border-gray-200">
            <p>
              ✨ Handcrafted by Warea •{" "}
              <span className="font-medium text-gray-700">
                100% quality guaranteed
              </span>
            </p>
            <p className="mt-1">
              Ships in <span className="font-semibold">2–4 business days</span>
            </p>
          </div>
        </div>
      </div>

      {/* 👑 Accent Divider */}
      <div className="mt-16 h-0.5 w-full bg-gradient-to-r from-transparent via-yellow-400/70 to-transparent rounded-full" />
    </div>
  );
}

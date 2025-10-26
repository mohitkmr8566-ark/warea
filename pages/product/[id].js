"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useCart } from "@/store/CartContext";
import { useWishlist } from "@/store/WishlistContext";
import {
  ShoppingCart,
  Heart,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
  Maximize2,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { addItem } = useCart();
  const { inWishlist, toggleItem } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // 🔥 Fetch Firestore product or fallback
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
              data.images?.map((i) => (typeof i === "string" ? { url: i } : i)) ||
              (data.image_url
                ? [{ url: data.image_url }]
                : data.image
                ? [{ url: data.image.url }]
                : []),
          });
        } else {
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
        <Link href="/shop" className="text-blue-600 hover:text-blue-700 transition">
          Back to Shop
        </Link>
      </div>
    );

  const wished = inWishlist?.(product.id);
  const mainImage = product.images?.[activeIndex]?.url || "/products/placeholder.png";

  const handleAddToCart = () => {
    addItem(product);
    toast.success(`${product.title} added to Cart ✅`);
  };

  const handleWishlist = () => {
    toggleItem(product);
    if (wished) toast.error(`${product.title} removed from Wishlist ❌`);
    else toast.success(`${product.title} added to Wishlist ❤️`);
  };

  const nextImage = () =>
    setActiveIndex((prev) => (prev + 1) % product.images.length);
  const prevImage = () =>
    setActiveIndex((prev) =>
      prev === 0 ? product.images.length - 1 : prev - 1
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Back */}
      <Link
        href="/shop"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft size={16} /> Back to Shop
      </Link>

      {/* Product layout */}
      <div className="grid md:grid-cols-2 gap-10 items-start">
        {/* 🖼️ Carousel */}
        <div className="relative">
          <div
            className="relative overflow-hidden rounded-2xl shadow-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white cursor-zoom-in"
            onClick={() => setFullscreen(true)}
            onMouseEnter={() => setZoomed(true)}
            onMouseLeave={() => setZoomed(false)}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={mainImage}
                src={mainImage}
                alt={product.title}
                className={`w-full h-[420px] object-cover transition-transform duration-500 ${
                  zoomed ? "scale-105" : ""
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>

            {/* Nav Buttons */}
            {product.images?.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 shadow-md transition"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 shadow-md transition"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <div className="absolute top-3 right-3 bg-white/80 rounded-full p-2 shadow-md">
              <Maximize2 size={18} />
            </div>
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-2 mt-4 justify-center flex-wrap">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-20 h-20 border-2 rounded-md overflow-hidden ${
                    idx === activeIndex
                      ? "border-yellow-500 shadow-md"
                      : "border-gray-200 hover:border-gray-400"
                  } transition`}
                >
                  <img
                    src={img.url}
                    alt={`thumb-${idx}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
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

      {/* 💡 Fullscreen Gallery Modal */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            className="fixed inset-0 bg-black/90 z-[9999] flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              onClick={() => setFullscreen(false)}
              className="absolute top-5 right-5 text-white bg-white/20 hover:bg-white/30 rounded-full p-2 transition"
            >
              <X size={24} />
            </button>

            <div className="relative max-w-5xl w-full">
              <motion.img
                key={activeIndex}
                src={mainImage}
                alt="fullscreen"
                className="w-full h-[80vh] object-contain"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              />

              {product.images?.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 text-white"
                  >
                    <ChevronLeft size={26} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 text-white"
                  >
                    <ChevronRight size={26} />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Divider */}
      <div className="mt-16 h-0.5 w-full bg-gradient-to-r from-transparent via-yellow-400/70 to-transparent rounded-full" />
    </div>
  );
}

// pages/product/[id].js
"use client";

import Head from "next/head";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit as fbLimit,
} from "firebase/firestore";
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
  ShieldCheck,
  Truck,
  BadgeCheck,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// ---------- Utils ----------
const formatINR = (n) =>
  (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const asArrayOfImages = (data) =>
  data?.images?.map((i) => (typeof i === "string" ? { url: i } : i)) ||
  (data?.image_url
    ? [{ url: data.image_url }]
    : data?.image
    ? [{ url: data.image.url }]
    : []);

// Flexible pricing: retail first, gold fallback
function retailPrice({ mrp, price, discountPct }) {
  const m = Number(mrp) || Number(price) || 0;
  let p = Number(price) || 0;
  if (!p && m && discountPct) p = Math.round(m * (1 - Number(discountPct) / 100));
  const discount = m > 0 ? Math.max(0, Math.round(((m - (p || 0)) / m) * 100)) : 0;
  return { mrp: m, price: p || m, discountPct: discount };
}
function goldPrice(product = {}, settings = {}) {
  const rate = Number(settings.goldRatePerGram) || 0;
  const wt = Number(product.weightGrams) || 0;
  const makingPct = Number(product.makingPct ?? settings.makingPct ?? 12);
  const gstPct = Number(product.gstPct ?? settings.gstPct ?? 3);
  const goldValue = Math.round(rate * wt);
  const making = Math.round((goldValue * makingPct) / 100);
  const sub = goldValue + making;
  const gst = Math.round((sub * gstPct) / 100);
  const total = sub + gst;
  return {
    model: "gold",
    goldValue,
    making,
    gst,
    total,
    mrp: total,
    price: total,
    discountPct: 0,
  };
}

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { addItem } = useCart();
  const { inWishlist, toggleItem } = useWishlist();

  const [product, setProduct] = useState(null);
  const [pricingSettings, setPricingSettings] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  // gallery
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  // lens zoom
  const [showLens, setShowLens] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [lensBg, setLensBg] = useState("");
  const containerRef = useRef(null);

  // pincode
  const [pincode, setPincode] = useState("");
  const [eta, setEta] = useState(null);

  // Fetch product + pricing settings + related
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const [snap, settingsSnap] = await Promise.all([
          getDoc(doc(db, "products", id)),
          getDoc(doc(db, "settings", "pricing")).catch(() => null),
        ]);

        if (snap.exists()) {
          const data = snap.data();
          const prod = {
            id: snap.id,
            title: data.title || "Untitled Product",
            description: data.description || "",
            category: data.category || "",
            material: data.material || "",
            mrp: Number(data.mrp) || Number(data.price) || 0,
            price: Number(data.price) || 0,
            discountPct: Number(data.discountPct) || 0,
            priceModel: data.priceModel || "retail", // "retail" | "gold"
            weightGrams: data.weightGrams || 0,
            makingPct: data.makingPct,
            gstPct: data.gstPct,
            sku: data.sku || "",
            images: asArrayOfImages(data),
          };
          setProduct(prod);
          setLensBg(prod.images?.[0]?.url || "");

          // related (same category, exclude self)
          if (prod.category) {
            const q = query(
              collection(db, "products"),
              where("category", "==", prod.category),
              fbLimit(12)
            );
            const relSnap = await getDocs(q);
            const rel = relSnap.docs
              .map((d) => ({ id: d.id, ...d.data(), images: asArrayOfImages(d.data()) }))
              .filter((p) => p.id !== prod.id);
            setRelated(rel);
          } else {
            setRelated([]);
          }
        } else {
          setProduct(null);
        }

        setPricingSettings(settingsSnap?.exists() ? settingsSnap.data() : null);
      } catch (e) {
        console.error(e);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // computed gallery things
  const images = product?.images || [];
  const hasImages = images.length > 0;
  const mainImage = hasImages ? images[activeIndex]?.url : "/products/placeholder.png";

  // computed pricing
  const retail = useMemo(
    () => (product ? retailPrice(product) : { mrp: 0, price: 0, discountPct: 0 }),
    [product]
  );
  const gold = useMemo(
    () => (product?.priceModel === "gold" ? goldPrice(product, pricingSettings || {}) : null),
    [product, pricingSettings]
  );
  const priceBlock = gold
    ? { ...gold, mrp: gold.mrp, price: gold.price, discountPct: 0 }
    : retail;

  const wished = inWishlist?.(product?.id);

  // actions
  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      ...product,
      price: priceBlock.price,
      mrp: priceBlock.mrp,
      discountPct: priceBlock.discountPct,
    });
    toast.success(`${product.title} added to Cart ✅`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push("/checkout");
  };

  const handleWishlist = () => {
    if (!product) return;
    toggleItem({
      ...product,
      price: priceBlock.price,
      mrp: priceBlock.mrp,
      discountPct: priceBlock.discountPct,
    });
    if (wished) toast.error(`${product.title} removed from Wishlist ❌`);
    else toast.success(`${product.title} added to Wishlist ❤️`);
  };

  const nextImage = () =>
    hasImages && setActiveIndex((p) => (p + 1) % images.length);
  const prevImage = () =>
    hasImages && setActiveIndex((p) => (p === 0 ? images.length - 1 : p - 1));

  // pincode ETA (mock)
  const checkPincode = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setEta(null);
      toast.error("Enter a valid 6-digit pincode");
      return;
    }
    const last = Number(pincode[pincode.length - 1]);
    const days = 3 + (last % 4);
    const etaDate = new Date();
    etaDate.setDate(etaDate.getDate() + days);
    setEta(etaDate.toDateString());
  };

  // lens zoom handlers
  const onMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLensPos({ x, y });
  };
  const lensSize = 180;
  const bgSize = 2.2; // zoom factor

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

  // SEO meta + JSON-LD
  const pageTitle = `${product.title} | Warea`;
  const pageDesc =
    product.description?.slice(0, 150) ||
    `Shop ${product.title} by Warea. Anti-tarnish, premium finish, fast shipping.`;
  const imagesForOG = images.map((i) => i.url);
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.title,
    sku: product.sku || product.id,
    brand: { "@type": "Brand", name: "Warea" },
    category: product.category || "Jewellery",
    image: imagesForOG,
    description: pageDesc,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: priceBlock.price || 0,
      availability: "https://schema.org/InStock",
      url: typeof window !== "undefined" ? window.location.href : "",
    },
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        {imagesForOG[0] && <meta property="og:image" content={imagesForOG[0]} />}
        <meta name="twitter:card" content="summary_large_image" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Back */}
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft size={16} /> Back to Shop
        </Link>

        {/* Layout */}
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Gallery + Lens */}
          <div className="relative">
            <div
              ref={containerRef}
              className="relative overflow-hidden rounded-2xl shadow-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white cursor-zoom-in"
              onClick={() => setFullscreen(true)}
              onMouseEnter={() => {
                setLensBg(mainImage);
                setShowLens(true);
              }}
              onMouseLeave={() => setShowLens(false)}
              onMouseMove={onMouseMove}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={mainImage}
                  src={mainImage}
                  alt={product.title}
                  className="w-full h-[420px] object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  onLoad={() => setLensBg(mainImage)}
                />
              </AnimatePresence>

              {/* Lens */}
              {showLens && (
                <div
                  className="pointer-events-none absolute rounded-full ring-2 ring-white/70 shadow-xl"
                  style={{
                    width: lensSize,
                    height: lensSize,
                    left: lensPos.x - lensSize / 2,
                    top: lensPos.y - lensSize / 2,
                    backgroundImage: `url(${lensBg})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: `${bgSize * 100}% ${bgSize * 100}%`,
                    backgroundPosition: `${((lensPos.x / (containerRef.current?.clientWidth || 1)) * 100) * (bgSize - 1)}% ${
                      ((lensPos.y / (containerRef.current?.clientHeight || 1)) * 100) * (bgSize - 1)
                    }%`,
                  }}
                />
              )}

              {/* Nav */}
              {hasImages && images.length > 1 && (
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
            {hasImages && images.length > 1 && (
              <div className="flex gap-2 mt-4 justify-center flex-wrap">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`w-20 h-20 border-2 rounded-md overflow-hidden ${
                      idx === activeIndex
                        ? "border-amber-500 shadow-md"
                        : "border-gray-200 hover:border-gray-400"
                    } transition`}
                    aria-label={`Image ${idx + 1}`}
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

          {/* Right: Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-semibold text-gray-900 tracking-tight">
                {product.title}
              </h1>
              {product.category && (
                <p className="text-sm uppercase tracking-wide text-amber-600 font-medium">
                  {product.category}
                </p>
              )}
            </div>

            {/* Price (MRP / Discount) */}
            <div className="space-y-1">
              {priceBlock.discountPct > 0 ? (
                <div className="flex items-end gap-3">
                  <div className="text-3xl font-bold text-gray-900">
                    ₹{formatINR(priceBlock.price)}
                  </div>
                  <span className="text-sm line-through text-gray-400">
                    ₹{formatINR(priceBlock.mrp)}
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    {priceBlock.discountPct}% OFF
                  </span>
                </div>
              ) : (
                <div className="text-3xl font-bold text-gray-900">
                  ₹{formatINR(priceBlock.price)}
                </div>
              )}
            </div>

            {/* Gold model breakup (if active) */}
            {product.priceModel === "gold" && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Price Breakup</h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Gold Value</span>
                    <span>₹{formatINR(gold?.goldValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Making ({(product.makingPct ?? pricingSettings?.makingPct ?? 12)}%)</span>
                    <span>₹{formatINR(gold?.making)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({(product.gstPct ?? pricingSettings?.gstPct ?? 3)}%)</span>
                    <span>₹{formatINR(gold?.gst)}</span>
                  </div>
                  <div className="border-t my-2" />
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Total</span>
                    <span>₹{formatINR(gold?.total)}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Calculated at ₹{formatINR(pricingSettings?.goldRatePerGram || 0)}/g • Weight{" "}
                  {product.weightGrams || 0}g
                </p>
              </div>
            )}

            {/* Retail price breakup (if has discount) */}
            {product.priceModel !== "gold" && priceBlock.discountPct > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Price Breakup</h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>MRP</span>
                    <span>₹{formatINR(priceBlock.mrp)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount ({priceBlock.discountPct}%)</span>
                    <span>- ₹{formatINR(priceBlock.mrp - priceBlock.price)}</span>
                  </div>
                  <div className="border-t my-2" />
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Selling Price</span>
                    <span>₹{formatINR(priceBlock.price)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg shadow-md hover:bg-gray-800 transition-all"
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="px-6 py-3 rounded-lg text-sm font-medium border border-amber-500 bg-amber-500 text-gray-900 hover:bg-amber-400 transition"
              >
                Buy Now
              </button>
              <button
                onClick={handleWishlist}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg border text-sm font-medium transition-all ${
                  wished
                    ? "bg-red-500 border-red-500 text-white hover:bg-red-600"
                    : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Heart size={18} fill={wished ? "white" : "none"} strokeWidth={1.8} />
                {wished ? "Wishlisted" : "Add to Wishlist"}
              </button>
            </div>

            {/* Delivery */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                Check Delivery & Services
              </h3>
              <form onSubmit={checkPincode} className="flex gap-2">
                <input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  maxLength={6}
                  placeholder="Enter pincode"
                  className="border rounded-lg px-3 py-2 text-sm w-40"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm bg-amber-500 text-white hover:bg-amber-400"
                >
                  Check
                </button>
              </form>
              <div className="mt-2 text-sm text-gray-600">
                {eta ? (
                  <span>
                    Estimated delivery by{" "}
                    <span className="font-medium text-gray-800">{eta}</span>
                  </span>
                ) : (
                  <span>
                    Ships in <span className="font-semibold">2–4 business days</span>
                  </span>
                )}
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <ShieldCheck className="text-amber-600" size={18} />
                <span>Anti-Tarnish & Premium Quality</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <BadgeCheck className="text-amber-600" size={18} />
                <span>Free 7-day Returns</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <Truck className="text-amber-600" size={18} />
                <span>Insured & Fast Shipping</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <Lock className="text-amber-600" size={18} />
                <span>Secure Checkout via Razorpay</span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-2 text-gray-700 leading-relaxed">{product.description}</div>
            )}
          </div>
        </div>

        {/* Fullscreen Gallery Modal */}
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

                {hasImages && images.length > 1 && (
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

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-semibold mb-4">Related Products</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {related.map((p) => {
                const imgs = asArrayOfImages(p);
                const href = `/product/${p.id}`;
                const m = Number(p.mrp) || Number(p.price) || 0;
                const pr = Number(p.price) || m;
                const disc = m > 0 ? Math.max(0, Math.round(((m - pr) / m) * 100)) : 0;
                return (
                  <Link
                    key={p.id}
                    href={href}
                    className="min-w-[220px] border rounded-xl bg-white hover:shadow-md transition"
                  >
                    <div className="aspect-[4/3] overflow-hidden rounded-t-xl">
                      <img
                        src={imgs?.[0]?.url || "/products/placeholder.png"}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="font-semibold">₹{formatINR(pr)}</span>
                        {disc > 0 && (
                          <>
                            <span className="text-xs line-through text-gray-400">
                              ₹{formatINR(m)}
                            </span>
                            <span className="text-xs text-green-600">{disc}% OFF</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Sticky Mobile CTA (with Buy Now) */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t border-gray-200 px-4 py-3 flex items-center justify-between lg:hidden">
        <div>
          {priceBlock.discountPct > 0 && (
            <span className="text-sm line-through text-gray-400 mr-2">
              ₹{formatINR(priceBlock.mrp)}
            </span>
          )}
          <span className="text-lg font-semibold">₹{formatINR(priceBlock.price)}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAddToCart}
            className="px-3 py-2 bg-gray-900 text-white text-sm rounded-lg"
          >
            Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            className="px-3 py-2 bg-amber-500 text-gray-900 text-sm rounded-lg"
          >
            Buy Now
          </button>
        </div>
      </div>
    </>
  );
}

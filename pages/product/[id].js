// pages/product/[id].js
"use client";

import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ShoppingCart,
  Heart,
  X,
  Maximize2,
  ShieldCheck,
  Truck,
  BadgeCheck,
  Lock,
} from "lucide-react";
import { db, auth } from "@/lib/firebase";

// consolidated Firestore imports — only one import block
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit as fbLimit,
  addDoc,
  serverTimestamp,
  orderBy,
  updateDoc,
  increment,
  deleteDoc,
  runTransaction,
} from "firebase/firestore";

import { useCart } from "@/store/CartContext";
import { useWishlist } from "@/store/WishlistContext";
import { useAuth } from "@/store/AuthContext"; // assumes AuthContext exists in project
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { addReview as addReviewToDb } from "@/lib/reviews"; // helper (create file as above)

/* ----------------------------- Utils ----------------------------- */
const fmtINR = (n) =>
  (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const coerceImages = (data) =>
  data?.images?.map((i) => (typeof i === "string" ? { url: i } : i)) ||
  (data?.image_url ? [{ url: data.image_url }] : data?.image ? [{ url: data.image.url }] : []);

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

/* --------------------------- Component --------------------------- */
export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const { addItem } = useCart();
  const { inWishlist, toggleItem } = useWishlist();
  const { user } = useAuth() || {}; // may be undefined if auth not wired yet

  const [product, setProduct] = useState(null);
  const [pricingSettings, setPricingSettings] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  // gallery
  const [active, setActive] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  // lens zoom
  const [showLens, setShowLens] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [lensBg, setLensBg] = useState("");
  const wrapRef = useRef(null);

  // pincode
  const [pincode, setPincode] = useState("");
  const [eta, setEta] = useState(null);

  // Ratings & reviews
  const [ratingValue, setRatingValue] = useState(4.8);
  const [reviewCount, setReviewCount] = useState(126);
  const [reviews, setReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  /* --------------------- Fetch: product & related --------------------- */
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
            priceModel: data.priceModel || "retail",
            weightGrams: data.weightGrams || 0,
            makingPct: data.makingPct,
            gstPct: data.gstPct,
            sku: data.sku || "",
            images: coerceImages(data),
          };
          setProduct(prod);
          setActive(0);
          setLensBg(prod.images?.[0]?.url || "");

          if (prod.category) {
            const q = query(collection(db, "products"), where("category", "==", prod.category), fbLimit(12));
            const relSnap = await getDocs(q);
            const rel = relSnap.docs
              .map((d) => ({ id: d.id, ...d.data(), images: coerceImages(d.data()) }))
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

  /* -------------------- Reviews: Fetch from Firestore -------------------- */
  const fetchReviews = async () => {
    if (!id) return;
    try {
      const revRef = collection(db, "products", id, "reviews");
      const q = query(revRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const items = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          rating: Number(raw.rating) || 0,
          comment: raw.comment || "",
          userId: raw.userId || null,
          userName: raw.userName || raw.userId || "Customer",
          createdAt: raw.createdAt ? raw.createdAt.toMillis?.() ?? raw.createdAt : null,
          flagged: raw.flagged === true,
          approved: raw.approved === true,
          flags: Number(raw.flags) || 0,
        };
      });

      const total = items.length;
      if (total === 0) {
        // fallback to pseudo values (keeps your previous behavior)
        setRatingValue(4.8);
        setReviewCount(126);
        setReviews([]);
        return;
      }

      const sum = items.reduce((s, r) => s + (Number(r.rating) || 0), 0);
      const avg = Number((sum / total).toFixed(1));

      setReviews(items);
      setRatingValue(avg);
      setReviewCount(total);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setRatingValue(4.8);
      setReviewCount(126);
      setReviews([]);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  /* -------------------- Derived: images & pricing -------------------- */
  const images = product?.images || [];
  const hasImages = images.length > 0;
  const mainImage = hasImages ? images[active]?.url : "/products/placeholder.png";

  const retail = useMemo(() => (product ? retailPrice(product) : { mrp: 0, price: 0, discountPct: 0 }), [product]);
  const gold = useMemo(() => (product?.priceModel === "gold" ? goldPrice(product, pricingSettings || {}) : null), [
    product,
    pricingSettings,
  ]);
  const priceBlock = gold ? { ...gold } : retail;

  const wished = inWishlist?.(product?.id);

  /* ------------------------------ Actions ------------------------------ */
  const addToCart = () => {
    if (!product) return;
    addItem({
      ...product,
      price: priceBlock.price,
      mrp: priceBlock.mrp,
      discountPct: priceBlock.discountPct,
      image: images?.[0]?.url,
    });
    toast.success(`${product.title} added to Cart ✅`);
  };

  const buyNow = () => {
    addToCart();
    router.push("/checkout");
  };

  const toggleWishlist = () => {
    if (!product) return;
    toggleItem({
      ...product,
      price: priceBlock.price,
      mrp: priceBlock.mrp,
      discountPct: priceBlock.discountPct,
      image: images?.[0]?.url,
    });
    if (wished) toast("Removed from Wishlist ❌");
    else toast.success("Added to Wishlist ❤️");
  };

  const onMouseMove = (e) => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setLensPos({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  const checkPincode = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setEta(null);
      toast.error("Enter a valid 6-digit pincode");
      return;
    }
    const days = 3 + (Number(pincode[pincode.length - 1]) % 4);
    const d = new Date();
    d.setDate(d.getDate() + days);
    setEta(d.toDateString());
  };

  /* --------------------- Submit Review (UI) --------------------- */
  const handleSubmitReview = async () => {
    if (!user || !user.email) {
      toast.error("Please log in to post a review");
      return;
    }
    if (!reviewRating || reviewComment.trim() === "") {
      toast.error("Please select a rating and write a comment");
      return;
    }
    if (!id) {
      toast.error("Product not loaded yet");
      return;
    }

    try {
      setSubmittingReview(true);
      // Use helper that writes serverTimestamp()
      await addReviewToDb(id, user, reviewRating, reviewComment.trim());
      toast.success("Review submitted — thank you!");
      // refresh reviews
      await fetchReviews();
      // reset form
      setReviewRating(5);
      setReviewComment("");
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error("Could not submit review. Try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  /* -------------------- Review Moderation Actions (Admin) -------------------- */
  // isAdmin check
  const isAdminUser = user && ["mohitkmr8566@gmail.com", "warea.admin@gmail.com"].includes(user.email);

  // report (customer action) — increments flags, marks flagged, sends admin email
  async function handleReportReview(reviewId) {
    if (!user || !user.email) {
      toast.error("Please log in to report a review");
      return;
    }

    if (!id) {
      toast.error("Product not loaded");
      return;
    }

    const reviewRef = doc(db, "products", id, "reviews", reviewId);

    try {
      // Ensure token is fresh so rules see auth token email
      if (auth?.currentUser) {
        await auth.currentUser.getIdToken(true);
      } else {
        toast.error("Please sign in again before reporting");
        return;
      }

      // Atomic increment via transaction so Firestore rules expecting flags == old + 1 pass
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(reviewRef);
        if (!snap.exists()) throw new Error("Review not found");

        const curFlags = Number(snap.data().flags || 0);
        // write only the allowed fields so rules' request.writeFields check passes
        tx.update(reviewRef, {
          flagged: true,
          flags: curFlags + 1,
        });
      });

      // Read the updated review doc for the notify payload
      const updatedSnap = await getDoc(reviewRef);
      const reviewData = updatedSnap.exists() ? { id: updatedSnap.id, ...updatedSnap.data() } : null;

      // notify server (email to admins)
      fetch("/api/notify-flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: id,
          reviewId,
          productTitle: product?.title || "",
          reporter: user?.email || user?.uid || "unknown",
          review: reviewData,
        }),
      }).catch((err) => console.warn("notify-flag failed:", err));

      toast.success("Thank you for reporting this review. Our team will review it soon.");
      await fetchReviews();
    } catch (err) {
      console.error("Error reporting review:", err);
      toast.error("Failed to report review.");
    }
  }

  // approve review (admin)
  async function handleApproveReview(reviewId) {
    if (!isAdminUser) {
      toast.error("Not authorized");
      return;
    }
    try {
      if (auth?.currentUser) await auth.currentUser.getIdToken(true);
      const reviewRef = doc(db, "products", id, "reviews", reviewId);
      await updateDoc(reviewRef, {
        approved: true,
        flagged: false,
        flags: 0,
      });
      toast.success("Review approved");
      await fetchReviews();
    } catch (err) {
      console.error("Error approving review:", err);
      toast.error("Failed to approve review");
    }
  }

  // unflag review (admin) — clears flagged and resets flags count
  async function handleUnflagReview(reviewId) {
    if (!isAdminUser) {
      toast.error("Not authorized");
      return;
    }
    try {
      if (auth?.currentUser) await auth.currentUser.getIdToken(true);
      const reviewRef = doc(db, "products", id, "reviews", reviewId);
      await updateDoc(reviewRef, {
        flagged: false,
        flags: 0,
      });
      toast.success("Review unflagged");
      await fetchReviews();
    } catch (err) {
      console.error("Error unflagging review:", err);
      toast.error("Failed to unflag review");
    }
  }
  // delete review (admin only)
  async function handleDeleteReview(reviewId) {
    if (!isAdminUser) {
      toast.error("Not authorized");
      return;
    }
    try {
      if (auth?.currentUser) await auth.currentUser.getIdToken(true);
      const ref = doc(db, "products", id, "reviews", reviewId);
      await deleteDoc(ref);
      toast.success("Review deleted");
      await fetchReviews();
    } catch (err) {
      console.error("Error deleting review:", err);
      toast.error("Failed to delete review");
    }
  }

  /* --------------------------- Loading / Empty -------------------------- */
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row gap-6">
          <Skeleton height={400} width={400} className="rounded-lg" />
          <div className="flex-1 space-y-3">
            <Skeleton height={30} width="80%" />
            <Skeleton height={20} width="60%" />
            <Skeleton height={20} width="50%" />
            <Skeleton height={50} width="40%" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-center px-4">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Product Not Found</h1>
          <Link href="/shop" className="text-blue-600 hover:text-blue-700">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  /* ------------------------------- SEO -------------------------------- */
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const productUrl = baseUrl && id ? `${baseUrl}/product/${id}` : typeof window !== "undefined" ? window.location.href : "";

  const title = `${product.title} | Warea`;
  const desc = product.description?.slice(0, 150) || `Shop ${product.title} by Warea. Anti-tarnish, premium finish, fast shipping.`;
  const ogImg = images?.[0]?.url;

  const productJsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.title,
    sku: product.sku || product.id,
    brand: { "@type": "Brand", name: "Warea" },
    category: product.category || "Jewellery",
    image: images.map((i) => i.url),
    description: desc,
    material: product.material || undefined,
    url: productUrl || undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: Number(priceBlock.price || 0),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      url: productUrl || undefined,
      seller: {
        "@type": "Organization",
        name: "Warea Creations",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: Number(ratingValue || 4.8),
      reviewCount: Number(reviewCount || 126),
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${baseUrl || ""}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: `${baseUrl || ""}/shop`,
      },
      ...(product.category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: product.category,
              item: `${baseUrl || ""}/shop?category=${encodeURIComponent(product.category)}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: product.category ? 4 : 3,
        name: product.title,
        item: productUrl || undefined,
      },
    ],
  };

  /* ------------------------------ Render ------------------------------ */
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={desc} />
        {productUrl && <link rel="canonical" href={productUrl} />}

        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="Warea" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        {productUrl && <meta property="og:url" content={productUrl} />}
        {ogImg && <meta property="og:image" content={ogImg} />}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={desc} />
        {ogImg && <meta name="twitter:image" content={ogImg} />}

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Back link */}
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft size={16} /> Back to Shop
        </Link>

        {/* Grid */}
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Gallery */}
          <div className="relative">
            <div
              ref={wrapRef}
              className="relative overflow-hidden rounded-2xl shadow-md border border-gray-200 bg-gradient-to-br from-gray-50 to-white cursor-zoom-in"
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
                    width: 180,
                    height: 180,
                    left: lensPos.x - 90,
                    top: lensPos.y - 90,
                    backgroundImage: `url(${lensBg})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: `220% 220%`,
                    backgroundPosition: `${
                      ((lensPos.x / (wrapRef.current?.clientWidth || 1)) * 100) * 1.2
                    }% ${((lensPos.y / (wrapRef.current?.clientHeight || 1)) * 100) * 1.2}%`,
                  }}
                />
              )}

              {/* Nav */}
              {hasImages && images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActive((p) => (p === 0 ? images.length - 1 : p - 1));
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 shadow-md"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActive((p) => (p + 1) % images.length);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 shadow-md"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              <div className="absolute top-3 right-3 bg-white/80 rounded-full p-2 shadow-md">
                <Maximize2 size={18} />
              </div>
            </div>

            {/* Thumbs */}
            {hasImages && images.length > 1 && (
              <div className="flex gap-2 mt-4 justify-center flex-wrap">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActive(idx)}
                    className={`w-20 h-20 border-2 rounded-md overflow-hidden transition ${
                      idx === active ? "border-amber-500 shadow" : "border-gray-200 hover:border-gray-400"
                    }`}
                    aria-label={`Image ${idx + 1}`}
                  >
                    <img src={img.url} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-semibold text-gray-900">{product.title}</h1>
              {product.category && (
                <p className="text-sm uppercase tracking-wide text-amber-600 font-medium">{product.category}</p>
              )}

              {/* Ratings summary (live) */}
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-amber-500 font-medium">{ratingValue?.toFixed ? ratingValue.toFixed(1) : ratingValue}</span>
                  <span className="text-sm text-gray-600">/ 5</span>
                </div>
                <div className="text-sm text-gray-500">({reviewCount} review{reviewCount !== 1 ? "s" : ""})</div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-1">
              {priceBlock.discountPct > 0 ? (
                <div className="flex items-end gap-3">
                  <div className="text-3xl font-bold text-gray-900">₹{fmtINR(priceBlock.price)}</div>
                  <span className="text-sm line-through text-gray-400">₹{fmtINR(priceBlock.mrp)}</span>
                  <span className="text-sm font-medium text-green-600">{priceBlock.discountPct}% OFF</span>
                </div>
              ) : (
                <div className="text-3xl font-bold text-gray-900">₹{fmtINR(priceBlock.price)}</div>
              )}
            </div>

            {/* Breakups */}
            {product.priceModel === "gold" ? (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Price Breakup</h3>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Gold Value</span>
                    <span>₹{fmtINR(gold?.goldValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Making ({product.makingPct ?? pricingSettings?.makingPct ?? 12}%)
                    </span>
                    <span>₹{fmtINR(gold?.making)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({product.gstPct ?? pricingSettings?.gstPct ?? 3}%)</span>
                    <span>₹{fmtINR(gold?.gst)}</span>
                  </div>
                  <div className="border-t my-2" />
                  <div className="flex justify-between font-semibold text-gray-900">
                    <span>Total</span>
                    <span>₹{fmtINR(gold?.total)}</span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Rate ₹{fmtINR(pricingSettings?.goldRatePerGram || 0)}/g • Weight {product.weightGrams || 0}g
                </p>
              </div>
            ) : (
              priceBlock.discountPct > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Price Breakup</h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>MRP</span>
                      <span>₹{fmtINR(priceBlock.mrp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount ({priceBlock.discountPct}%)</span>
                      <span>- ₹{fmtINR(priceBlock.mrp - priceBlock.price)}</span>
                    </div>
                    <div className="border-t my-2" />
                    <div className="flex justify-between font-semibold text-gray-900">
                      <span>Selling Price</span>
                      <span>₹{fmtINR(priceBlock.price)}</span>
                    </div>
                  </div>
                </div>
              )
            )}

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <button onClick={addToCart} className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg shadow-md hover:bg-gray-800">
                <ShoppingCart size={18} /> Add to Cart
              </button>
              <button onClick={buyNow} className="px-6 py-3 rounded-lg text-sm font-medium border border-amber-500 bg-amber-500 text-gray-900 hover:bg-amber-400">
                Buy Now
              </button>
              <button
                onClick={toggleWishlist}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg border text-sm font-medium transition ${
                  wished ? "bg-red-500 border-red-500 text-white hover:bg-red-600" : "border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Heart size={18} fill={wished ? "white" : "none"} strokeWidth={1.8} />
                {wished ? "Wishlisted" : "Add to Wishlist"}
              </button>
            </div>

            {/* Delivery / Services */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Check Delivery & Services</h3>
              <form onSubmit={checkPincode} className="flex gap-2">
                <input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  maxLength={6}
                  placeholder="Enter pincode"
                  className="border rounded-lg px-3 py-2 text-sm w-40"
                />
                <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-amber-500 text-gray-900 hover:bg-amber-400">
                  Check
                </button>
              </form>
              <div className="mt-2 text-sm text-gray-600">
                {eta ? (
                  <>
                    Estimated delivery by <span className="font-medium text-gray-800">{eta}</span>
                  </>
                ) : (
                  <>
                    Ships in <span className="font-semibold">2–4 business days</span>
                  </>
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
                <span>Free 7-day Replacement</span>
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
            {product.description && <div className="pt-2 text-gray-700 leading-relaxed">{product.description}</div>}

            {/* ---------- Reviews UI ---------- */}
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold">Customer Reviews</h3>

              {/* Review form (only for logged-in users) */}
              {user ? (
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setReviewRating(s)}
                        className={`text-2xl ${reviewRating >= s ? "text-amber-500" : "text-gray-300"}`}
                        aria-label={`Rate ${s}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="border rounded-lg w-full p-2 mb-2"
                    placeholder="Write your review..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSubmitReview}
                      disabled={submittingReview}
                      className="bg-amber-500 text-gray-900 px-4 py-2 rounded-lg hover:bg-amber-400"
                    >
                      {submittingReview ? "Submitting…" : "Submit Review"}
                    </button>
                    <button onClick={() => { setReviewRating(5); setReviewComment(""); }} className="px-4 py-2 rounded-lg border">
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-sm text-gray-600">
                  <Link href="/login" className="text-amber-500 font-medium">Log in</Link> to write a review.
                </div>
              )}

              {/* Reviews list */}
              <div className="mt-6 space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-sm text-gray-500">No reviews yet. Be the first to review!</div>
                ) : (
                  reviews
                    .filter((r) => {
                      const hideForCustomers = Number(r.flags || 0) >= 3;
                      if (isAdminUser) return true; // admins see all
                      return !hideForCustomers; // hide heavily flagged
                    })
                    .map((r) => (
                      <div key={r.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium">{r.userName}</div>
                            <div className="text-xs text-gray-500">
                              {r.createdAt ? (typeof r.createdAt === "number" ? new Date(r.createdAt).toLocaleDateString() : new Date(r.createdAt).toLocaleDateString()) : ""}
                            </div>
                          </div>
                          <div className="text-amber-500 font-semibold">{r.rating}/5</div>
                        </div>
                        {r.comment && <div className="mt-2 text-sm text-gray-700">{r.comment}</div>}

                        {/* New moderation/report UI integrated */}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            {r.flags > 0 && <span className="mr-3">🚩 {r.flags} flag{r.flags !== 1 ? "s" : ""}</span>}
                            {r.approved && <span className="text-green-700 font-medium">✅ Approved</span>}
                            {!r.approved && r.flagged && <span className="text-red-600 font-medium">🚩 Flagged</span>}
                          </div>

                          <div className="flex items-center gap-3">
                            {!isAdminUser && (
                              <button onClick={() => handleReportReview(r.id)} className="text-xs text-red-600 hover:underline">
                                🚩 Report Review
                              </button>
                            )}

                            {isAdminUser && (
                              <>
                                {!r.approved && (
                                  <button onClick={() => handleApproveReview(r.id)} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    ✅ Approve
                                  </button>
                                )}
                                {r.flagged && (
                                  <button onClick={() => handleUnflagReview(r.id)} className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                                    ✖️ Unflag
                                  </button>
                                )}
                                <button onClick={() => handleDeleteReview(r.id)} className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                  🗑️ Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>

              {/* Moderation Console (Admin only) */}
              {isAdminUser && (
                <div className="mt-8 border-t pt-6">
                  <h4 className="text-md font-semibold mb-3">Moderation Console</h4>
                  <p className="text-sm text-gray-600 mb-4">Quick actions for flagged reviews. Approve to mark good reviews, or Unflag to clear flags.</p>

                  {reviews.filter((r) => r.flagged || r.flags > 0).length === 0 ? (
                    <div className="text-sm text-gray-500">No flagged reviews currently.</div>
                  ) : (
                    <div className="space-y-3">
                      {reviews
                        .filter((r) => r.flagged || r.flags > 0)
                        .map((r) => (
                          <div key={`mod-${r.id}`} className="border rounded-lg p-3 bg-white">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="text-sm font-medium">{r.userName}</div>
                                <div className="text-xs text-gray-500">{r.createdAt ? (typeof r.createdAt === "number" ? new Date(r.createdAt).toLocaleString() : new Date(r.createdAt).toLocaleString()) : ""}</div>
                                <div className="mt-2 text-sm text-gray-700">{r.comment}</div>
                                <div className="mt-2 text-xs text-gray-600">Flags: {r.flags}</div>
                              </div>
                              <div className="flex flex-col gap-2">
                                {!r.approved && (
                                  <button onClick={() => handleApproveReview(r.id)} className="px-3 py-2 bg-green-600 text-white rounded text-sm">
                                    Approve
                                  </button>
                                )}
                                <button onClick={() => handleUnflagReview(r.id)} className="px-3 py-2 bg-gray-200 rounded text-sm">
                                  Unflag / Clear
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm("Are you sure you want to permanently delete this review?")) {
                                      handleDeleteReview(r.id);
                                    }
                                  }}
                                  className="px-3 py-2 bg-red-600 text-white rounded text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* ---------- end reviews UI ---------- */}
          </div>
        </div>

        {/* Fullscreen gallery, Related, Sticky CTA — unchanged (rendered below) */}
      </div>

      {/* Fullscreen gallery */}
      <AnimatePresence>
        {fullscreen && (
          <motion.div
            className="fixed inset-0 bg-black/90 z-[9999] flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button onClick={() => setFullscreen(false)} className="absolute top-5 right-5 text-white bg-white/20 hover:bg-white/30 rounded-full p-2">
              <X size={24} />
            </button>

            <div className="relative max-w-5xl w-full">
              <motion.img
                key={active}
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
                    onClick={() => setActive((p) => (p === 0 ? images.length - 1 : p - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 text-white"
                  >
                    <ChevronLeft size={26} />
                  </button>
                  <button onClick={() => setActive((p) => (p + 1) % images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 text-white">
                    <ChevronRight size={26} />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Related */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mt-16">
          <h2 className="text-xl font-semibold mb-4">Related Products</h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {related.map((p) => {
              const imgs = coerceImages(p);
              const href = `/product/${p.id}`;
              const m = Number(p.mrp) || Number(p.price) || 0;
              const pr = Number(p.price) || m;
              const disc = m > 0 ? Math.max(0, Math.round(((m - pr) / m) * 100)) : 0;

              return (
                <Link key={p.id} href={href} className="min-w-[220px] border rounded-xl bg-white hover:shadow-md transition">
                  <div className="aspect-[4/3] overflow-hidden rounded-t-xl">
                    <img src={imgs?.[0]?.url || "/products/placeholder.png"} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium line-clamp-1">{p.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-semibold">₹{fmtINR(pr)}</span>
                      {disc > 0 && (
                        <>
                          <span className="text-xs line-through text-gray-400">₹{fmtINR(m)}</span>
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

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t border-gray-200 px-4 py-3 flex items-center justify-between lg:hidden">
        <div>
          {priceBlock.discountPct > 0 && <span className="text-sm line-through text-gray-400 mr-2">₹{fmtINR(priceBlock.mrp)}</span>}
          <span className="text-lg font-semibold">₹{fmtINR(priceBlock.price)}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={addToCart} className="px-3 py-2 bg-gray-900 text-white text-sm rounded-lg">
            Add to Cart
          </button>
          <button onClick={buyNow} className="px-3 py-2 bg-amber-500 text-gray-900 text-sm rounded-lg">
            Buy Now
          </button>
        </div>
      </div>
    </>
  );
}

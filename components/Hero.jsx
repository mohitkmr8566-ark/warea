"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, memo } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

/* ✅ Local fallback to ensure the first paint is deterministic */
const FALLBACK = [
  {
    id: "fallback-1",
    img: "/hero-banner.webp",
    title: "Elegant Jewellery",
    desc: "Timeless beauty, crafted for every moment.",
    ctaPrimary: { label: "Shop Now", href: "/shop" },
    ctaSecondary: { label: "Explore Collections", href: "/shop?sort=new" },
  },
];

function HeroComponent() {
  // ✅ Start with fallback → prevents mismatch between SSR & client
  const [slides, setSlides] = useState(FALLBACK);

  // 🟢 1. ADD THE "MOUNTED" STATE
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []); // This runs *only* on the client

  useEffect(() => {
    // 🟢 2. PREVENT FIRESTORE FROM RUNNING ON SERVER
    if (!mounted) return; // Don't fetch data until mounted on client

    const q = query(collection(db, "heroSlides"), orderBy("order", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const valid = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => s.isActive && !s.isDraft)
          .map((s) => ({
            id: s.id,
            img: s.image?.url || "/hero-banner.webp",
            title: s.title || "",
            desc: s.subtitle || "",
            ctaPrimary: { label: "Shop Now", href: s.link || "/shop" },
            ctaSecondary: { label: "Explore Collections", href: "/shop?sort=new" },
          }));

        setSlides(valid.length ? valid : FALLBACK);
      },
      (err) => console.error("Hero snapshot error:", err)
    );

    return () => unsub();
  }, [mounted]); // 🟢 3. ADD 'mounted' AS A DEPENDENCY

  // 🟢 4. ADD A SKELETON LOADER
  // This renders on the server AND the client's first pass, so they match
  if (!mounted) {
    return (
      <section
        className="relative w-full overflow-hidden
                  h-[60vh] sm:h-[65vh] md:h-[70vh] lg:h-[75vh]
                  bg-gray-200 animate-pulse"
        aria-label="Loading featured collections"
      />
    );
  }

  // 🟢 5.ORIGINAL RENDER

  return (
    <section
      className="relative w-full overflow-hidden
                 h-[60vh] sm:h-[65vh] md:h-[70vh] lg:h-[75vh]"
      aria-label="Featured jewellery collections"
    >
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 4500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ clickable: true }}
        navigation
        loop={slides.length > 1} // ✅ Only loop if more than 1 slide
        className="w-full h-full"
      >
        {slides.map((slide, i) => (
          <SwiperSlide key={slide.id || i} className="w-full overflow-hidden">
            <div className="relative w-full h-full">
              <Image
                src={
                  slide.img.startsWith("http")
                    ? `${slide.img}?q=75&f=auto&fit=cover&w=1920` // ✅ Cloudinary dynamic
                    : "/hero-banner.webp"                          // ✅ Local fallback, NO query params
                }
                alt={slide.title || "Warea Jewellery Banner"}
                fill
                priority={i === 0}
                sizes="100vw"
                fetchPriority="high"
                unoptimized // ✅ Stops Next.js from hitting /_next/image → No reload loops
                className="object-cover object-center
                           brightness-100 contrast-110 saturate-110
                           transition-transform duration-[2500ms]
                           md:scale-105 hover:scale-110
                           max-sm:scale-100 will-change-transform max-w-full"
              />

              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent pointer-events-none" />

              {/* Text & CTA */}
              <div
                className="absolute left-1/2 -translate-x-1/2
                           bottom-10 sm:bottom-16 md:bottom-24
                           text-white w-[90%] sm:w-auto max-w-2xl
                           px-2 sm:px-0 text-center sm:text-left"
              >
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold leading-tight drop-shadow-md">
                  {slide.title}
                </h1>
                {slide.desc && (
                  <p className="mt-3 sm:mt-4 text-sm sm:text-lg md:text-xl text-gray-100 drop-shadow-sm">
                    {slide.desc}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-3 justify-center sm:justify-start">
                  <Link
                    href={slide.ctaPrimary.href}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl
                               bg-amber-400 text-gray-900 text-sm sm:text-base font-semibold
                               shadow-md hover:bg-amber-300 transition"
                  >
                    {slide.ctaPrimary.label} →
                  </Link>
                  <Link
                    href={slide.ctaSecondary.href}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl
                               border-2 border-white text white text-sm sm:text-base font-medium
                               shadow hover:bg-white transition backdrop-blur"
                  >
                    {slide.ctaSecondary.label}
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

export default memo(HeroComponent);

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

/* ----------------------------- FALLBACK SLIDES ----------------------------- */
const FALLBACK = [
  {
    img: "/hero-banner.webp", // ✅ use local compressed webp
    title: "Elegant Jewellery",
    desc: "Timeless beauty, crafted for every moment.",
    ctaPrimary: { label: "Shop Now", href: "/shop" },
    ctaSecondary: { label: "Explore Collections", href: "/shop?sort=new" },
  },
];

/* ------------------------------- COMPONENT ------------------------------- */
function HeroComponent() {
  const [slides, setSlides] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "heroSlides"), orderBy("order", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const validSlides = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => s.isActive && !s.isDraft)
          .map((s) => ({
            id: s.id,
            img: s.image?.url,
            title: s.title || "",
            desc: s.subtitle || "",
            ctaPrimary: { label: "Shop Now", href: s.link || "/shop" },
            ctaSecondary: { label: "Explore Collections", href: "/shop?sort=new" },
          }));
        setSlides(validSlides.length ? validSlides : FALLBACK);
      },
      (err) => console.error("Hero snapshot error:", err)
    );
    return () => unsub();
  }, []);

  const data = slides.length ? slides : FALLBACK;

  return (
    <section
      className="relative w-full h-[480px] sm:h-[600px] md:h-[700px] lg:h-[750px] xl:h-[800px]"
      aria-label="Featured jewellery collections"
    >
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{
          delay: 4200,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{ clickable: true }}
        navigation
        loop={data.length > 1}
        className="w-full h-full"
      >
        {data.map((slide, i) => (
          <SwiperSlide key={slide.id || i}>
            <div className="relative w-full h-full">
              {/* ✅ Optimized next/image */}
              <Image
                src={`${slide.img || "/hero-banner.webp"}?f_auto,q_auto,w_1920`} // Cloudinary URL params for optimization
                alt={slide.title || "Warea Jewellery Banner"}
                fill
                priority={i === 0}
                fetchPriority="high"
                loading="eager"
                sizes="100vw"
                className="object-cover object-center brightness-[0.7] scale-105 transition-transform duration-[2500ms] hover:scale-110"
              />

              {/* ✅ Enhanced Overlay Gradient for text visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-transparent" />

              {/* ✅ Text Overlay */}
              <div className="absolute inset-x-4 sm:inset-x-8 md:left-16 md:right-auto bottom-10 sm:bottom-16 md:bottom-24 text-white max-w-[90%] sm:max-w-xl md:max-w-2xl drop-shadow-xl">
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold leading-tight text-white/95">
                  {slide.title}
                </h1>
                {slide.desc && (
                  <p className="mt-3 sm:mt-4 text-sm sm:text-lg md:text-xl text-gray-100/95">
                    {slide.desc}
                  </p>
                )}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href={slide.ctaPrimary.href}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-amber-400 text-gray-900 text-sm sm:text-base font-semibold shadow-md hover:bg-amber-300 transition"
                    aria-label={slide.ctaPrimary.label}
                  >
                    {slide.ctaPrimary.label} →
                  </Link>
                  <Link
                    href={slide.ctaSecondary.href}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/90 text-gray-900 text-sm sm:text-base font-medium shadow hover:bg-white transition backdrop-blur"
                    aria-label={slide.ctaSecondary.label}
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

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

const FALLBACK = [
  {
    img: "/hero-banner.webp",
    title: "Elegant Jewellery",
    desc: "Timeless beauty, crafted for every moment.",
    ctaPrimary: { label: "Shop Now", href: "/shop" },
    ctaSecondary: { label: "Explore Collections", href: "/shop?sort=new" },
  },
];

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
      className="relative w-full
      h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[85vh] xl:h-[90vh]" // More responsive heights
      aria-label="Featured jewellery collections"
    >
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{
          delay: 4500,
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
              {/* ✅ Higher quality, no dullness, no over-dark */}
              <Image
                src={
                  slide.img && slide.img.startsWith("http")
                    ? `${slide.img}?q=75&f=auto&fit=cover&w=1920`
                    : slide.img || "/hero-banner.webp"
                }
                alt={slide.title || "Warea Jewellery Banner"}
                fill
                priority={i === 0}
                sizes="100vw"
                fetchPriority="high"
                className="
                  object-cover object-center
                  brightness-100 contrast-110 saturate-110
                  transition-transform duration-[2500ms]
                  md:scale-105 hover:scale-110
                  max-sm:scale-100
                "
              />

              {/* ✅ Softer gradient overlay (no faded, washed look) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent pointer-events-none" />

              {/* ✅ Text Content */}
              <div className="
                absolute inset-x-4 sm:inset-x-8
                bottom-10 sm:bottom-16 md:bottom-24
                text-white max-w-[90%] sm:max-w-xl md:max-w-2xl
                drop-shadow-lg
              ">
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold leading-tight text-white">
                  {slide.title}
                </h1>
                {slide.desc && (
                  <p className="mt-3 sm:mt-4 text-sm sm:text-lg md:text-xl text-gray-100">
                    {slide.desc}
                  </p>
                )}

                {/* ✅ CTA Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
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
                    bg-white/90 text-gray-900 text-sm sm:text-base font-medium
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

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
    img: "https://res.cloudinary.com/dciykssl9/image/upload/v1759959805/hero1_n2seph.jpg",
    title: "Elevate Your Elegance",
    desc: "Timeless jewellery crafted to perfection.",
    ctaPrimary: { label: "Shop Now", href: "/shop" },
    ctaSecondary: { label: "Explore Collections", href: "/shop?sort=new" },
  },
  {
    img: "https://res.cloudinary.com/dciykssl9/image/upload/v1759959806/hero2_lcikwe.jpg",
    title: "Festive Collection ✨",
    desc: "Celebrate with brilliance and grace.",
    ctaPrimary: { label: "View Festive", href: "/shop?tag=festive" },
    ctaSecondary: { label: "New Arrivals", href: "/shop?sort=new" },
  },
  {
    img: "https://res.cloudinary.com/dciykssl9/image/upload/v1759959808/hero4_bj2dls.jpg",
    title: "Wedding Specials ❤️",
    desc: "Make your big day sparkle forever.",
    ctaPrimary: { label: "Bridal Jewellery", href: "/shop?tag=bridal" },
    ctaSecondary: { label: "Best Sellers", href: "/shop?sort=popular" },
  },
];

/* ------------------------------- COMPONENT ------------------------------- */
function HeroComponent() {
  const [slides, setSlides] = useState([]);

  // ✅ Fetch from Firestore with fallback
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
      className="relative w-full h-[450px] sm:h-[600px] md:h-[700px] lg:h-[750px] xl:h-[800px]"
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
            <div className="relative w-full h-[450px] sm:h-[600px] md:h-[700px] lg:h-[750px] xl:h-[800px]">
              {/* ✅ Use Cloudinary’s built-in blur instead of local placeholder */}
              <Image
                src={`${slide.img}?q=80&f_auto`}
                alt={slide.title || "Warea Jewellery Banner"}
                fill
                priority={i === 0}
                className="object-cover object-center transition-transform duration-[2500ms] scale-105 hover:scale-110"
              />

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent" />

              {/* Text Overlay */}
              <div className="absolute inset-x-4 sm:inset-x-8 md:left-16 md:right-auto bottom-7 sm:bottom-12 md:bottom-20 text-white max-w-[90%] sm:max-w-xl md:max-w-2xl drop-shadow-md">
                <h1 className="text-xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold leading-tight">
                  {slide.title}
                </h1>
                {slide.desc && (
                  <p className="mt-3 sm:mt-4 text-sm sm:text-lg md:text-xl text-gray-100/95">
                    {slide.desc}
                  </p>
                )}
                <div className="mt-5 sm:mt-6 flex flex-wrap gap-3">
                  <Link
                    href={slide.ctaPrimary.href}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-amber-400 text-gray-900 text-sm sm:text-base font-semibold shadow-lg hover:bg-amber-300 transition"
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

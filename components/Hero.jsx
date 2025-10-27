"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, A11y } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

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

export default function Hero() {
  const [slides, setSlides] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "heroSlides"), orderBy("order", "asc"));
    let unsub = () => {};

    try {
      unsub = onSnapshot(q, (snap) => {
        const now = new Date();
        const rows = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((s) => {
            const start = s.startDate && String(s.startDate).trim() !== "" ? new Date(s.startDate) : null;
            const end = s.endDate && String(s.endDate).trim() !== "" ? new Date(s.endDate) : null;
            if (start && now < start) return false;
            if (end && now > end) return false;
            if (s.isDraft) return false;
            if (s.isActive === false) return false;
            return true;
          })
          .map((data) => ({
            id: data.id,
            img: data.image?.url || "",
            title: data.title || "",
            desc: data.subtitle || "",
            ctaPrimary: { label: "Shop Now", href: data.link || "/shop" },
            ctaSecondary: { label: "Explore Collections", href: "/shop?sort=new" },
          }));
        setSlides(rows);
      });
    } catch (err) {
      console.error("Hero listener create error:", err);
    }

    return () => {
      try {
        unsub && unsub();
      } catch {}
    };
  }, []);

  const data = slides.length ? slides : FALLBACK;

  return (
    <section
      className="relative w-full h-[450px] sm:h-[600px] md:h-[700px] lg:h-[750px] xl:h-[800px] overflow-hidden rounded-none animate-fadeIn"
      aria-label="Featured collections"
    >
      <Swiper
        modules={[Autoplay, Pagination, Navigation, A11y]}
        autoplay={{ delay: 4200, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ clickable: true }}
        navigation
        loop
        a11y={{ enabled: true }}
        className="w-full h-full"
      >
        {data.map((slide, i) => (
          <SwiperSlide key={slide.id || i} aria-roledescription="slide">
            <div className="relative w-full h-full">
              <Image
                src={slide.img}
                alt={slide.title}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

              <div className="absolute inset-x-4 sm:inset-x-8 md:left-16 md:right-auto bottom-7 sm:bottom-12 md:bottom-20 text-white max-w-[90%] sm:max-w-xl md:max-w-2xl">
                <h1 className="text-xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                  {slide.title}
                </h1>
                {slide.desc && (
                  <p className="mt-3 sm:mt-4 text-sm sm:text-lg md:text-xl text-gray-100/95 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
                    {slide.desc}
                  </p>
                )}
                <div className="mt-5 sm:mt-6 flex flex-wrap gap-3">
                  <Link
                    href={slide.ctaPrimary.href}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-amber-400 text-gray-900 text-sm sm:text-base font-semibold shadow-lg hover:bg-amber-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-amber-300"
                    aria-label={slide.ctaPrimary.label}
                  >
                    {slide.ctaPrimary.label} →
                  </Link>
                  <Link
                    href={slide.ctaSecondary.href}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white/90 text-gray-900 text-sm sm:text-base font-medium shadow hover:bg-white transition backdrop-blur focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white"
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

"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const heroSlides = [
  {
    img: "/hero/hero1.jpg",
    title: "Timeless. Elegant. Warea.",
    desc: "Handcrafted jewellery for every occasion.",
  },
  {
    img: "/hero/hero2.jpg",
    title: "Festive Collection ✨",
    desc: "Celebrate with brilliance and grace.",
  },
  {
    img: "/hero/hero3.jpg",
    title: "Everyday Elegance 💎",
    desc: "Minimal designs for daily shine.",
  },
  {
    img: "/hero/hero4.jpg",
    title: "Wedding Specials ❤️",
    desc: "Make your big day sparkle forever.",
  },
  {
    img: "/hero/hero5.jpg",
    title: "New Arrivals 🌸",
    desc: "Discover the latest handcrafted trends.",
  },
  {
    img: "/hero/hero6.jpg",
    title: "Exclusive Offers 🎁",
    desc: "Shop now and enjoy special deals.",
  },
];

export default function Hero() {
  return (
    <section className="relative w-full h-[65vh] sm:h-[70vh] md:h-[80vh] lg:h-[85vh] overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation={true}
        loop={true}
        className="w-full h-full"
      >
        {heroSlides.map((slide, i) => (
          <SwiperSlide key={i}>
            <div className="relative w-full h-full">
              {/* Background Image */}
              <Image
                src={slide.img}
                alt={slide.title}
                fill
                priority={i === 0}
                className="object-cover object-center"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>

              {/* Text Content */}
              <div className="absolute bottom-10 sm:bottom-14 md:bottom-20 left-4 sm:left-10 md:left-16 text-white max-w-xs sm:max-w-md md:max-w-xl">
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold leading-snug drop-shadow-lg">
                  {slide.title}
                </h1>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-gray-200 drop-shadow-md max-w-md">
                  {slide.desc}
                </p>
                <Link
                  href="/shop"
                  className="inline-block mt-5 sm:mt-6 px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-black text-sm sm:text-base font-semibold rounded-lg shadow-md hover:bg-gray-200 transition"
                >
                  Shop Now →
                </Link>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

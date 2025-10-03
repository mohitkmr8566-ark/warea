"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

const heroSlides = [
  { img: "/hero/hero1.jpg", title: "Timeless. Elegant. Warea.", desc: "Handcrafted jewellery for every occasion." },
  { img: "/hero/hero2.jpg", title: "Festive Collection ✨", desc: "Celebrate with brilliance and grace." },
  { img: "/hero/hero3.jpg", title: "Everyday Elegance 💎", desc: "Minimal designs for daily shine." },
  { img: "/hero/hero4.jpg", title: "Wedding Specials ❤️", desc: "Make your big day sparkle forever." },
  { img: "/hero/hero5.jpg", title: "New Arrivals 🌸", desc: "Discover the latest handcrafted trends." },
  { img: "/hero/hero6.jpg", title: "Exclusive Offers 🎁", desc: "Shop now and enjoy special deals." },
];

export default function Hero() {
  return (
    <section className="relative w-full h-[60vh] sm:h-[68vh] md:h-[78vh] lg:h-[85vh] overflow-hidden">
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
              <Image src={slide.img} alt={slide.title} fill className="object-cover object-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
              <div className="absolute bottom-6 sm:bottom-10 md:bottom-16 left-4 sm:left-8 md:left-16 text-white max-w-[92%] sm:max-w-md md:max-w-lg lg:max-w-xl">
                <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-bold leading-tight drop-shadow-lg">{slide.title}</h1>
                <p className="mt-2 text-xs sm:text-sm md:text-base lg:text-lg text-gray-200 drop-shadow-md max-w-md">{slide.desc}</p>
                <Link href="/shop" className="inline-block mt-4 px-4 py-2 bg-white text-black text-sm rounded-md shadow-md hover:bg-gray-100 transition">Shop Now →</Link>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

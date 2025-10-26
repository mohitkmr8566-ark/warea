"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// 🖼️ Cloudinary URLs (replace with your actual URLs)
const heroSlides = [
  { img: "https://res.cloudinary.com/dciykssl9/image/upload/v1759959805/hero1_n2seph.jpg", title: "Timeless. Elegant. Warea.", desc: "Handcrafted jewellery for every occasion." },
  { img: "https://res.cloudinary.com/dciykssl9/image/upload/v1759959806/hero2_lcikwe.jpg", title: "Festive Collection ✨", desc: "Celebrate with brilliance and grace." },
  { img: "https://res.cloudinary.com/dciykssl9/image/upload/v1759959807/hero3_attujt.jpg", title: "Everyday Elegance 💎", desc: "Minimal designs for daily shine." },
  { img: "https://res.cloudinary.com/dciykssl9/image/upload/v1759959808/hero4_bj2dls.jpg", title: "Wedding Specials ❤️", desc: "Make your big day sparkle forever." },
  { img: "https://res.cloudinary.com/dciykssl9/image/upload/v1759959809/hero5_ze6fpl.jpg", title: "New Arrivals 🌸", desc: "Discover the latest handcrafted trends." },
  { img: "https://res.cloudinary.com/dciykssl9/image/upload/v1759959812/hero6_aqd7bq.jpg", title: "Exclusive Offers 🎁", desc: "Shop now and enjoy special deals." },
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
                <Link href="/shop" className="inline-block mt-4 px-4 py-2 bg-white text-black text-sm rounded-md shadow-md hover:bg-gray-100 transition">
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

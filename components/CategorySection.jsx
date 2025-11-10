"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const categories = [
  {
    name: "Earrings",
    image: "https://res.cloudinary.com/dciykssl9/image/upload/v1759959785/earrings_yh4keg.jpg",
    link: "/shop?cat=earrings",
  },
  {
    name: "Bracelets",
    image: "https://res.cloudinary.com/dciykssl9/image/upload/v1759959784/bracelets_sg3btu.jpg",
    link: "/shop?cat=bracelets",
  },
  {
    name: "Necklaces",
    image: "https://res.cloudinary.com/dciykssl9/image/upload/v1759959787/necklaces_ndj4t7.jpg",
    link: "/shop?cat=necklaces",
  },
  {
    name: "Rings",
    image: "https://res.cloudinary.com/dciykssl9/image/upload/v1762011991/Rings_j6gk1q.jpg",
    link: "/shop?cat=rings",
  },
  {
    name: "Gift Sets",
    image: "https://res.cloudinary.com/dciykssl9/image/upload/v1759959785/giftsets_wtxlgs.jpg",
    link: "/shop?cat=giftsets",
  },
];

export default function CategorySection() {
  return (
    <section className="w-full max-w-full overflow-x-hidden py-14 sm:py-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-serif font-bold text-center mb-10 tracking-tight">
          Shop by Collection
        </h2>

        {/* ✅ Responsive grid, fully stable & optimized */}
        <div
          className="
            grid
            grid-cols-2
            sm:grid-cols-3
            md:grid-cols-4
            lg:grid-cols-5
            gap-4 sm:gap-6 md:gap-8
            place-items-center
            w-full
            min-w-0
          "
        >
          {categories.map((cat, index) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              viewport={{ once: true, amount: 0.3 }}
              className="w-full flex justify-center"
            >
              <Link
                href={cat.link}
                className="
                  group block rounded-2xl overflow-hidden border bg-white shadow-sm
                  hover:shadow-md hover:-translate-y-1 transition-all duration-300
                  w-28 sm:w-32 md:w-36 lg:w-40
                  mx-auto
                  focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2
                "
              >
                <div className="aspect-square overflow-hidden relative">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                    onError={(e) => {
                      e.currentTarget.src = "/products/placeholder.png"; // fallback image
                    }}
                    unoptimized={false} // ✅ Allows Next.js to optimize cloudinary images
                  />
                </div>

                <div
                  className="
                    py-2.5 text-center bg-gray-50 group-hover:bg-yellow-50
                    transition-colors duration-300
                  "
                >
                  <h3 className="text-sm sm:text-base font-medium group-hover:text-yellow-600">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

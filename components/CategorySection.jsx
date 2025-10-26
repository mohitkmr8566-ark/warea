"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// ✅ Cloudinary URLs for categories (only 4 — no duplicates)
const categories = [
  {
    name: "Earrings",
    image:
      "https://res.cloudinary.com/dciykssl9/image/upload/v1759959785/earrings_yh4keg.jpg",
    link: "/shop?cat=earrings",
  },
  {
    name: "Bracelets",
    image:
      "https://res.cloudinary.com/dciykssl9/image/upload/v1759959784/bracelets_sg3btu.jpg",
    link: "/shop?cat=bracelets",
  },
  {
    name: "Necklaces",
    image:
      "https://res.cloudinary.com/dciykssl9/image/upload/v1759959787/necklaces_ndj4t7.jpg",
    link: "/shop?cat=necklaces",
  },
  {
    name: "Gift Sets",
    image:
      "https://res.cloudinary.com/dciykssl9/image/upload/v1759959785/giftsets_wtxlgs.jpg",
    link: "/shop?cat=giftsets",
  },
];

export default function CategorySection() {
  return (
    <section className="container py-14">
      <h2 className="text-3xl font-bold text-center mb-10 tracking-tight">
        Shop by Collection
      </h2>

      {/* ✅ Fixed grid: always max 4 items */}
      <div className="mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 place-items-center max-w-5xl">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            viewport={{ once: true }}
          >
            <Link
              href={cat.link}
              className="group block rounded-2xl overflow-hidden border bg-white shadow-sm
                         hover:shadow-lg hover:-translate-y-1 transition-all duration-300
                         w-28 sm:w-32 md:w-40 lg:w-44"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) =>
                    (e.currentTarget.src = "/products/placeholder.png")
                  }
                />
              </div>
              <div className="py-2 text-center bg-gray-50 group-hover:bg-yellow-50 transition-colors duration-300">
                <h3 className="text-sm sm:text-base font-medium transition-colors duration-300 group-hover:text-yellow-600">
                  {cat.name}
                </h3>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

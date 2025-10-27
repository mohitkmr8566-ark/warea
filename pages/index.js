"use client";

import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection";
import ProductGrid from "@/components/ProductGrid";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <>
      {/* 🖼️ Hero Section */}
      <Hero />

      {/* 🛍️ Category Section */}
      <section className="py-10 sm:py-14 border-t border-gray-100 animate-fadeIn">
        <div className="page-container">
          <CategorySection />
        </div>
      </section>

      {/* ✨ Featured Products Section */}
      <section className="py-10 sm:py-14 border-t border-gray-100 animate-fadeIn">
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-wide text-center mb-8">
              Featured Products
            </h2>
          </motion.div>

          <ProductGrid />
        </div>
      </section>
    </>
  );
}

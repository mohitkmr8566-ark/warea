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
      <div className="page-container">
        <CategorySection />

        {/* ✨ Featured Products Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold text-center mt-10 mb-6 tracking-tight">
            Featured Products
          </h2>
        </motion.div>

        <ProductGrid />
      </div>
    </>
  );
}

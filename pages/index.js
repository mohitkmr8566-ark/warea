import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection";
import ProductGrid from "@/components/ProductGrid";
import { PRODUCTS } from "@/lib/products";

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="page-container">
        <CategorySection />
        <h2 className="text-3xl font-bold text-center mt-10 mb-6">Featured Products</h2>
        <ProductGrid products={PRODUCTS} />
      </div>
    </>
  );
}

import ProductCard from "./ProductCard";

export default function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
      {products.map((p) => (
        <div key={p.id} className="p-1 sm:p-2">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  );
}

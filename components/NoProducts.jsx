// components/NoProducts.jsx
import Link from "next/link";

export default function NoProducts() {
  return (
    <div className="text-center py-20">
      <img
        src="/empty-box.png"   // put an icon/image in /public/empty-box.png
        alt="No Products"
        className="mx-auto w-32 h-32 opacity-80 mb-5"
      />
      <h2 className="text-xl font-semibold mb-2">No products found</h2>
      <p className="text-gray-600 mb-4">
        Looks like there are no products in this category yet.
      </p>
      <Link
        href="/shop"
        className="inline-block bg-gray-900 text-white px-5 py-2 rounded hover:bg-gray-700 transition"
      >
        View All Products
      </Link>
    </div>
  );
}

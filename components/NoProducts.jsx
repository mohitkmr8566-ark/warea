// components/NoProducts.jsx
import Link from "next/link";

export default function NoProducts() {
  return (
    <div className="w-full max-w-full overflow-x-hidden text-center py-20 px-4">
      <img
        src="/empty-box.png" // Put an icon/image in /public/empty-box.png
        alt="No Products"
        className="mx-auto w-32 h-32 max-w-full opacity-80 mb-5 object-contain"
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

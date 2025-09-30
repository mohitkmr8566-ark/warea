import Link from "next/link";
import { useCart } from "@/store/CartContext";
import { useWishlist } from "@/store/WishlistContext";

export default function ProductCard({ product }) {
  const { addItem } = useCart() || {};
  const { inWishlist, toggleItem } = useWishlist() || {};

  // ✅ Directly check membership
  const wished = inWishlist?.(product.id);

  return (
    <div className="group border rounded-xl overflow-hidden bg-white">
      <img
        src={product.images?.[0]}
        alt={product.title}
        className="w-full aspect-square object-cover"
      />

      <div className="p-4 text-center">
        <h3 className="font-semibold">{product.title}</h3>
        <p className="text-sm text-gray-500">{product.material}</p>
        <p className="font-medium mt-1">₹{product.price}</p>

        <div className="mt-3 flex gap-2 justify-center">
          <button
            className="btn btn-primary"
            onClick={() => addItem?.(product)}
          >
            Add to Cart
          </button>
          <button
            className={`btn ${wished ? "btn-primary" : "btn-ghost"}`}
            onClick={() => toggleItem?.(product)}
          >
            {wished ? "♥ Wishlisted" : "♡ Wishlist"}
          </button>
          <Link href={`/product/${product.id}`} className="btn">
            View
          </Link>
        </div>
      </div>
    </div>
  );
}

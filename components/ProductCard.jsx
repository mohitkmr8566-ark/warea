import Link from "next/link";
import { useCart } from "@/store/CartContext";
import { useWishlist } from "@/store/WishlistContext";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import toast from "react-hot-toast";

export default function ProductCard({ product }) {
  const { addItem } = useCart() || {};
  const { inWishlist, toggleItem } = useWishlist() || {};
  const wished = inWishlist?.(product.id);

  const handleAddToCart = () => {
    addItem?.(product);
    toast.success(`${product.title} added to Cart 🛒`);
  };

  return (
    <div className="group border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300">
      {/* Image wrapper */}
      <div className="relative">
        <img
          src={product.images?.[0]}
          alt={product.title}
          className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Wishlist Icon (top-right corner) */}
        <button
          onClick={() => toggleItem?.(product)}
          className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition
                     ${wished ? "bg-red-500 text-white" : "bg-white text-gray-600 hover:bg-red-100"}`}
        >
          <Heart size={18} fill={wished ? "white" : "none"} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 text-center">
        <h3 className="font-semibold text-sm md:text-base">{product.title}</h3>
        <p className="text-xs md:text-sm text-gray-500">{product.material}</p>
        <p className="font-medium mt-1">₹{product.price}</p>

        {/* Action Buttons */}
        <div className="mt-4 flex justify-center gap-3">
          {/* Add to Cart */}
          <button
            onClick={handleAddToCart}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs md:text-sm hover:bg-gray-700 transition"
          >
            <ShoppingCart size={16} /> Cart
          </button>

          {/* View Product */}
          <Link
            href={`/product/${product.id}`}
            className="flex items-center gap-1 px-3 py-2 rounded-lg border text-xs md:text-sm hover:bg-gray-100 transition"
          >
            <Eye size={16} /> View
          </Link>
        </div>
      </div>
    </div>
  );
}

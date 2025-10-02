import Link from "next/link";
import { useWishlist } from "@/store/WishlistContext";
import { useCart } from "@/store/CartContext";
import toast from "react-hot-toast";
import { ShoppingCart, Eye, Heart } from "lucide-react";

export default function WishlistPage() {
  const { wishlist, toggleItem, inWishlist } = useWishlist();
  const { addItem } = useCart();

  const handleAddToCart = (p) => {
    addItem(p);
    toast.success(`${p.title} added to Cart 🛒`);
  };

  return (
    <div className="page-container py-10">
      <h1 className="text-3xl font-bold mb-6">Your Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Your wishlist is empty.</p>
          <Link href="/shop" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {wishlist.map((p) => {
            const wished = inWishlist(p.id);

            return (
              <div
                key={p.id}
                className="group border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300"
              >
                {/* Image wrapper */}
                <div className="relative">
                  <img
                    src={p.images?.[0]}
                    alt={p.title}
                    className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Wishlist Icon */}
                  <button
                    onClick={() => {
                      toggleItem(p);
                      toast.error(`${p.title} removed from Wishlist ❌`);
                    }}
                    className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition
                                ${wished ? "bg-red-500 text-white" : "bg-white text-gray-600 hover:bg-red-100"}`}
                  >
                    <Heart size={18} fill={wished ? "white" : "none"} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 text-center">
                  <h3 className="font-semibold text-sm md:text-base">{p.title}</h3>
                  <p className="text-xs md:text-sm text-gray-500">{p.material}</p>
                  <p className="font-medium mt-1">₹{p.price}</p>

                  {/* Actions */}
                  <div className="mt-4 flex justify-center gap-3">
                    <button
                      onClick={() => handleAddToCart(p)}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs md:text-sm hover:bg-gray-700 transition"
                    >
                      <ShoppingCart size={16} /> Cart
                    </button>

                    <Link
                      href={`/product/${p.id}`}
                      className="flex items-center gap-1 px-3 py-2 rounded-lg border text-xs md:text-sm hover:bg-gray-100 transition"
                    >
                      <Eye size={16} /> View
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

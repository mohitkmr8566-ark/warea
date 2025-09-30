import Link from "next/link";
import { useWishlist } from "@/store/WishlistContext";
import { useCart } from "@/store/CartContext";
import toast from "react-hot-toast"; // ✅ Import toast

export default function WishlistPage() {
  const { wishlist, toggleItem } = useWishlist();
  const { addItem } = useCart();

  const handleRemove = (p) => {
    toggleItem(p);
    toast.error(`${p.title} removed from Wishlist`); // ✅ Show toast
  };

  const handleAddToCart = (p) => {
    addItem(p);
    toast.success(`${p.title} added to Cart`); // ✅ Show toast
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((p) => (
            <div key={p.id} className="border rounded-xl p-4">
              <img
                src={p.images?.[0]}
                alt={p.title}
                className="w-full h-48 object-cover rounded-lg"
              />
              <h3 className="font-semibold mt-3">{p.title}</h3>
              <p className="text-sm text-gray-500">{p.material}</p>
              <p className="font-medium mt-1">₹{p.price}</p>

              <div className="mt-3 flex gap-2">
                <button className="btn btn-primary" onClick={() => handleAddToCart(p)}>
                  Add to Cart
                </button>
                <button className="btn btn-ghost" onClick={() => handleRemove(p)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

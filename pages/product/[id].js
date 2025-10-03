import { useRouter } from "next/router";
import Link from "next/link";
import { PRODUCTS } from "@/lib/products";
import { useCart } from "@/store/CartContext";
import { useWishlist } from "@/store/WishlistContext";
import toast from "react-hot-toast";

export default function ProductDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const product = PRODUCTS?.find((p) => p.id === id);
  const { addItem } = useCart();
  const { toggleItem, wishlist } = useWishlist();

  const inWishlist = wishlist?.some((p) => p.id === id);

  if (!product) {
    return (
      <div className="page-container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <Link href="/shop" className="text-blue-600 hover:underline">
          Back to Shop
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product);
    toast.success(`${product.title} added to Cart ✅`);
  };

  const handleWishlist = () => {
    toggleItem(product);
    if (inWishlist) {
      toast.error(`${product.title} removed from Wishlist ❌`);
    } else {
      toast.success(`${product.title} added to Wishlist ❤️`);
    }
  };

  return (
    <div className="page-container py-12 grid md:grid-cols-2 gap-12">
      {/* Image */}
      <div className="flex justify-center">
        <img
          src={product.images?.[0]}
          alt={product.title}
          className="w-full max-w-lg aspect-square object-cover rounded-xl shadow-md"
        />
      </div>

      {/* Details */}
      <div className="flex flex-col justify-center">
        <h1 className="text-3xl font-bold mb-3">{product.title}</h1>
        <p className="text-gray-600 text-lg mb-2">{product.material}</p>
        <p className="text-2xl font-semibold mb-4">₹{product.price}</p>

        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={handleAddToCart}>
            Add to Cart
          </button>
          <button
            className={`btn ${inWishlist ? "btn-primary" : "btn-ghost"}`}
            onClick={handleWishlist}
          >
            {inWishlist ? "✔ In Wishlist" : "♡ Add to Wishlist"}
          </button>
        </div>

        <Link href="/shop" className="btn btn-ghost mt-6">
          Back to Shop
        </Link>
      </div>
    </div>
  );
}

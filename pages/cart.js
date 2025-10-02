import Link from "next/link";
import { useCart } from "@/store/CartContext";
import { Trash2, Plus, Minus } from "lucide-react";
import toast from "react-hot-toast";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCart();

  const handleRemove = (item) => {
    removeItem(item.id);
    toast.error(`${item.title} removed from Cart ❌`);
  };

  const handleClearCart = () => {
    clearCart();
    toast.success("Cart cleared 🛒");
  };

  return (
    <div className="page-container py-10">
      <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Your cart is empty.</p>
          <Link href="/shop" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 border rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300 p-4"
              >
                {/* Product Image */}
                <img
                  src={item.images?.[0]}
                  alt={item.title}
                  className="w-28 h-28 object-cover rounded-lg"
                />

                {/* Product Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-base">{item.title}</h3>
                    <p className="text-sm text-gray-500">{item.material}</p>
                    <p className="mt-1 font-medium">₹{item.price}</p>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="mt-3 flex items-center gap-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center border rounded-lg">
                      <button
                        className="px-2 py-1 hover:bg-gray-100"
                        onClick={() => {
                          updateQuantity(item.id, Math.max(1, (item.qty || 1) - 1));
                          toast.success(`Quantity updated for ${item.title}`);
                        }}
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={item.qty || 1}
                        onChange={(e) => {
                          updateQuantity(
                            item.id,
                            Math.max(1, Number(e.target.value) || 1)
                          );
                          toast.success(`Quantity updated for ${item.title}`);
                        }}
                        className="w-12 text-center border-0 focus:ring-0"
                      />
                      <button
                        className="px-2 py-1 hover:bg-gray-100"
                        onClick={() => {
                          updateQuantity(item.id, (item.qty || 1) + 1);
                          toast.success(`Quantity updated for ${item.title}`);
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      className="text-red-500 hover:text-red-700 flex items-center gap-1"
                      onClick={() => handleRemove(item)}
                    >
                      <Trash2 size={16} /> <span className="text-sm">Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="p-6 border rounded-xl h-fit sticky top-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="flex justify-between py-2 border-b">
              <span>Subtotal</span>
              <span className="font-medium">₹{subtotal.toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Taxes & shipping calculated at checkout.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Link
                href="/checkout"
                className="btn btn-primary w-full text-center"
              >
                Proceed to Checkout
              </Link>
              <button
                className="btn btn-ghost w-full"
                onClick={handleClearCart}
              >
                Clear Cart
              </button>
              <Link href="/shop" className="btn btn-ghost w-full text-center">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

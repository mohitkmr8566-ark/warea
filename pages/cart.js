import Link from "next/link";
import { useCart } from "@/store/CartContext";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, subtotal } = useCart();

// ...keep your JSX, but call removeItem(item.id) and updateQuantity(item.id, qty)

return (
    <div className="page-container py-10">
      <h1 className="text-3xl font-bold mb-6">Your Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Your cart is empty.</p>
          <Link href="/shop" className="btn btn-primary">Browse Products</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 border rounded-xl">
                <img
                  src={item.images?.[0]}
                  alt={item.title}
                  className="w-28 h-28 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.material}</p>
                  <p className="mt-1 font-medium">₹{item.price}</p>

                  <div className="mt-3 flex items-center gap-3">
                    <button onClick={() => updateQuantity(item.id, Math.max(1, (item.qty || 1) - 1))}>−</button>
                    <input
                      type="number"
                      min={1}
                      value={item.qty || 1}
                      onChange={(e) => updateQuantity(item.id, Math.max(1, Number(e.target.value) || 1))}
                    />
                    <button onClick={() => updateQuantity(item.id, (item.qty || 1) + 1)}>＋</button>

                    <button className="btn btn-ghost ml-3" onClick={() => removeItem(item.id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="p-6 border rounded-xl h-fit sticky top-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="flex justify-between py-2 border-b">
              <span>Subtotal</span>
              <span className="font-medium">₹{subtotal.toLocaleString()}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Taxes & shipping calculated at checkout.</p>

            <div className="mt-6 flex flex-col gap-3">
              <Link href="/checkout" className="btn btn-primary w-full text-center">Proceed to Checkout</Link>
              <button className="btn btn-ghost w-full" onClick={clearCart}>Clear Cart</button>
              <Link href="/shop" className="btn btn-ghost w-full text-center">Continue Shopping</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useCart } from "@/store/CartContext";
import { Trash2, Plus, Minus } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

function firstImage(item) {
  if (Array.isArray(item?.images) && item.images.length) {
    const v = item.images[0];
    return typeof v === "string" ? v : v?.url;
  }
  return (
    item?.image?.url ||
    item?.image ||
    item?.imageUrl ||
    item?.imageURL ||
    item?.image_url ||
    "/products/placeholder.png"
  );
}

export default function CartPage() {
  const { items = [], updateQuantity, removeItem, clearCart, subtotal = 0 } = useCart() || {};

  const handleRemove = (item) => {
    removeItem?.(item.id);
    toast.error(`${item?.title ?? "Item"} removed from Cart ❌`);
  };

  const handleClearCart = () => {
    clearCart?.();
    toast.success("Cart cleared 🛒");
  };

  return (
    <>
      {/* 🛍️ Page Header */}
      <section className="bg-gradient-to-b from-gray-50 to-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-serif font-bold mb-3"
          >
            Your Shopping Cart
          </motion.h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto">
            Review your selected pieces and proceed to checkout when you're ready.
          </p>
        </div>
      </section>

      <div className="page-container py-10">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <img
              src="/empty-state.svg"
              alt="Empty Cart"
              className="mx-auto mb-6 w-44 opacity-70"
            />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">
              Looks like you haven't added any items yet.
            </p>
            <Link
              href="/shop"
              className="inline-flex px-6 py-3 rounded-full bg-black text-white hover:bg-gray-800 transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* 🧾 Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence>
                {items.map((item) => {
                  const productLink = `/product/${encodeURIComponent(item.slug || item.id)}`;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="flex flex-col sm:flex-row gap-4 border rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 p-4"
                    >
                      {/* 🖼️ Image */}
                      <Link href={productLink} className="shrink-0">
                        <img
                          src={firstImage(item)}
                          alt={item.title || "Product"}
                          className="w-full sm:w-32 h-32 object-cover rounded-2xl bg-gray-50 cursor-pointer hover:scale-105 transition-transform duration-500 ease-out"
                          onError={(e) => (e.currentTarget.src = "/products/placeholder.png")}
                        />
                      </Link>

                      {/* 📝 Info */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <Link href={productLink}>
                            <h3 className="font-semibold text-base sm:text-lg truncate hover:text-yellow-600 transition cursor-pointer">
                              {item.title || "Product"}
                            </h3>
                          </Link>
                          {(item.material || item.category) && (
                            <p className="text-sm text-gray-500 mt-0.5">
                              {item.material || item.category}
                            </p>
                          )}
                          <p className="mt-2 font-medium text-gray-800 text-sm sm:text-base">
                            ₹{item.price}
                          </p>
                        </div>

                        {/* 🧮 Quantity Controls */}
                        <div className="mt-4 flex items-center justify-between sm:justify-start gap-4">
                          <div className="flex items-center border rounded-full overflow-hidden shadow-sm">
                            <button
                              className="px-3 py-1.5 hover:bg-gray-100 transition"
                              onClick={() => {
                                updateQuantity?.(item.id, Math.max(1, (item.qty || 1) - 1));
                                toast.success(`Quantity updated`);
                              }}
                            >
                              <Minus size={14} />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.qty || 1}
                              onChange={(e) => {
                                const v = Math.max(1, Number(e.target.value) || 1);
                                updateQuantity?.(item.id, v);
                                toast.success(`Quantity updated`);
                              }}
                              className="w-14 text-center border-0 focus:ring-0 font-medium"
                            />
                            <button
                              className="px-3 py-1.5 hover:bg-gray-100 transition"
                              onClick={() => {
                                updateQuantity?.(item.id, (item.qty || 1) + 1);
                                toast.success(`Quantity updated`);
                              }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <button
                            className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm"
                            onClick={() => handleRemove(item)}
                          >
                            <Trash2 size={16} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* 🧾 Order Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="p-6 border rounded-3xl h-fit sticky top-6 bg-white shadow-lg"
            >
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-900">
                  ₹{Number(subtotal || 0).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Taxes &amp; shipping calculated at checkout.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/checkout"
                  className="inline-flex justify-center items-center px-6 py-3 rounded-full bg-black text-white hover:bg-gray-800 transition"
                >
                  Proceed to Checkout
                </Link>
                <button
                  className="inline-flex justify-center items-center px-6 py-3 rounded-full border hover:bg-gray-50 transition"
                  onClick={handleClearCart}
                >
                  Clear Cart
                </button>
                <Link
                  href="/shop"
                  className="inline-flex justify-center items-center px-6 py-3 rounded-full border hover:bg-gray-50 transition"
                >
                  Continue Shopping
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
}

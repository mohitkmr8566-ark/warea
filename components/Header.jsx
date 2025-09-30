import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Heart, User, Search, Menu, X } from "lucide-react";
import { useCart } from "@/store/CartContext";
import { useWishlist } from "@/store/WishlistContext";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { items: cartItems = [] } = useCart() || {};
  const { items: wishItems = [] } = useWishlist() || {};
  const cartCount = cartItems.reduce((s, i) => s + (i.qty || 1), 0);
  const wishCount = wishItems.length;

// ...keep your existing JSX (icons, nav, mobile drawer) ...

return (
  <header className="border-b bg-white shadow-sm">
      {/* Top Bar */}
      <div className="bg-orange-50 text-center text-sm py-2 text-gray-700 font-medium">
        ✨ Free Shipping on Orders Above ₹599 ✨
      </div>

      {/* Main Header */}
        <div className="page-container flex items-center justify-between h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="Warea Logo"
            width={60}
            height={60}
            className="object-contain"
          />
          <span className="text-4xl font-bold font-serif tracking-wide">
            WAREA
          </span>
        </Link>

        {/* Navigation (Desktop) */}
        <nav className="hidden md:flex gap-10 text-lg font-medium">
          <Link href="/" className="hover:text-gray-700">
            Home
          </Link>
          <Link href="/shop" className="hover:text-gray-700">
            Shop
          </Link>
          <Link href="/about" className="hover:text-gray-700">
            About
          </Link>
          <Link href="/contact" className="hover:text-gray-700">
            Contact
          </Link>
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-8">
          {/* Search */}
          <Link href="/search" className="flex flex-col items-center">
            <Search size={24} />
            <span className="text-xs mt-1">Search</span>
          </Link>

          {/* Wishlist */}
          <Link href="/wishlist" className="flex flex-col items-center relative">
            <Heart size={24} />
            {wishCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full px-1">
                {wishCount}
              </span>
            )}
            <span className="text-xs mt-1">Wishlist</span>
          </Link>

          {/* Cart */}
          <Link href="/cart" className="flex flex-col items-center relative">
            <ShoppingBag size={24} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-black text-white text-xs rounded-full px-1">
                {cartCount}
              </span>
            )}
            <span className="text-xs mt-1">Cart</span>
          </Link>

          {/* Account */}
          <Link href="/profile" className="flex flex-col items-center">
            <User size={24} />
            <span className="text-xs mt-1">Account</span>
          </Link>

          {/* Mobile Menu */}
          <button
            className="lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle Menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {open && (
        <div className="lg:hidden bg-white border-t p-4 flex flex-col gap-4 text-lg font-medium">
          <Link href="/" onClick={() => setOpen(false)}>
            Home
          </Link>
          <Link href="/shop" onClick={() => setOpen(false)}>
            Shop
          </Link>
          <Link href="/about" onClick={() => setOpen(false)}>
            About
          </Link>
          <Link href="/contact" onClick={() => setOpen(false)}>
            Contact
          </Link>
        </div>
      )}
    </header>
  );
}

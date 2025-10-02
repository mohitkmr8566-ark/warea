import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Heart, User, Search, Menu, X } from "lucide-react";
import { useCart } from "@/store/CartContext";
import { useWishlist } from "@/store/WishlistContext";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { items: cartItems = [] } = useCart() || {};
  const { wishlist = [] } = useWishlist() || {};
  const cartCount = cartItems.reduce((s, i) => s + (i.qty || 1), 0);
  const wishCount = wishlist.length;

  return (
    <header className="border-b bg-white shadow-sm sticky top-0 z-40">
      {/* Top Bar */}
      <div className="bg-orange-50 text-center text-sm py-2 text-gray-700 font-medium">
        ✨ Free Shipping on Orders Above ₹599 ✨
      </div>

      {/* Main Header */}
      <div className="page-container flex items-center justify-between h-16 md:h-20 px-2 md:px-0">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 md:gap-4">
          <Image
            src="/logo.png"
            alt="Warea Logo"
            width={40}
            height={40}
            className="object-contain w-10 h-10 md:w-[60px] md:h-[60px]"
          />
          {/* Hide WAREA text on extra small screens */}
          <span className="hidden sm:inline text-2xl md:text-4xl font-bold font-serif tracking-wide">
            WAREA
          </span>
        </Link>

        {/* Navigation (Desktop) */}
        <nav className="hidden md:flex gap-10 text-lg font-medium">
          <Link href="/">Home</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/help">Help</Link>
        </nav>

        {/* Icons */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
          {/* Search */}
          <Link href="/search" className="relative flex flex-col items-center w-8 h-8 md:w-10 md:h-10">
            <Search size={20} className="md:size-22" />
            <span className="text-[9px] md:text-[10px] mt-0.5">Search</span>
          </Link>

          {/* Wishlist */}
          <Link href="/wishlist" className="relative flex flex-col items-center w-8 h-8 md:w-10 md:h-10">
            <Heart size={20} className="md:size-22" />
            {wishCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] md:text-[10px] rounded-full px-1 min-w-[16px] h-[16px] md:min-w-[18px] md:h-[18px] flex items-center justify-center">
                {wishCount}
              </span>
            )}
            <span className="text-[9px] md:text-[10px] mt-0.5">Wishlist</span>
          </Link>

          {/* Cart */}
          <Link href="/cart" className="relative flex flex-col items-center w-8 h-8 md:w-10 md:h-10">
            <ShoppingBag size={20} className="md:size-22" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] md:text-[10px] rounded-full px-1 min-w-[16px] h-[16px] md:min-w-[18px] md:h-[18px] flex items-center justify-center">
                {cartCount}
              </span>
            )}
            <span className="text-[9px] md:text-[10px] mt-0.5">Cart</span>
          </Link>

          {/* Account */}
          <Link href="/profile" className="flex flex-col items-center w-8 h-8 md:w-10 md:h-10">
            <User size={20} className="md:size-22" />
            <span className="text-[9px] md:text-[10px] mt-0.5">Account</span>
          </Link>

          {/* Mobile Menu */}
          <button
            className="lg:hidden w-8 h-8 md:w-10 md:h-10 flex items-center justify-center"
            onClick={() => setOpen(!open)}
            aria-label="Toggle Menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {open && (
        <div className="lg:hidden bg-white border-t p-4 flex flex-col gap-4 text-lg font-medium">
          <Link href="/" onClick={() => setOpen(false)}>Home</Link>
          <Link href="/shop" onClick={() => setOpen(false)}>Shop</Link>
          <Link href="/about" onClick={() => setOpen(false)}>About</Link>
          <Link href="/contact" onClick={() => setOpen(false)}>Contact</Link>
          <Link href="/profile" onClick={() => setOpen(false)}>Profile</Link>
          <Link href="/help" onClick={() => setOpen(false)}>Help</Link>
        </div>
      )}
    </header>
  );
}

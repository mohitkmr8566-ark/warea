// components/Header.jsx
import { useAuth } from "@/store/AuthContext";
import { useState, useEffect, useRef } from "react";
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
  const { user } = useAuth();

  // bump animation state when cartCount changes
  const [bump, setBump] = useState(false);
  const prevRef = useRef(cartCount);

  useEffect(() => {
    if (prevRef.current !== undefined && prevRef.current !== cartCount) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 380);
      return () => clearTimeout(t);
    }
    prevRef.current = cartCount;
  }, [cartCount]);

  return (
    <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
      {/* NOTE: TopBar intentionally NOT rendered here. TopBar is rendered once in _app.js */}

      <div className="page-container flex items-center gap-3 sm:gap-6 py-2 md:py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Image src="/logo.png" alt="Warea Logo" width={44} height={44} className="object-contain w-10 h-10 md:w-[60px] md:h-[60px]" />
          <span className="hidden sm:inline text-2xl md:text-3xl font-serif font-bold tracking-wide">WAREA</span>
        </Link>

        {/* Navigation: shows from md up */}
        <nav className="hidden md:flex gap-8 text-base font-medium flex-1">
          <Link href="/">Home</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/help">Help</Link>

          {/* ✅ Admin link (only visible for your admin account) */}
          {user?.email === "mohitkmr8566@gmail.com" && (
            <Link
              href="/admin/orders"
              className="text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-100 px-2 py-1 rounded-md"
            >
            Admin Panel
            </Link>
          )}
        </nav>

        {/* Icons (push to right, don't shrink) */}
        <div className="flex items-center gap-3 md:gap-5 ml-auto flex-shrink-0">
          {/* Search — hide on very small screens */}
          <Link href="/search" className="hidden sm:flex flex-col items-center w-8 h-8 md:w-10 md:h-10">
            <Search size={20} />
            <span className="text-[10px] mt-0.5">Search</span>
          </Link>

          {/* Wishlist */}
          <Link href="/wishlist" className="relative flex flex-col items-center w-8 h-8 md:w-10 md:h-10">
            <Heart size={20} />
            {wishCount > 0 && <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] rounded-full px-1 min-w-[18px] h-[18px] flex items-center justify-center">{wishCount}</span>}
            <span className="text-[9px] md:text-[10px] mt-0.5 hidden sm:block">Wishlist</span>
          </Link>

          {/* Cart w/ bump */}
          <Link href="/cart" className="relative flex flex-col items-center w-8 h-8 md:w-10 md:h-10">
            <span className={`${bump ? "cart-bump" : ""} inline-flex`}>
              <ShoppingBag size={20} />
            </span>
            {cartCount > 0 && <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] rounded-full px-1 min-w-[18px] h-[18px] flex items-center justify-center">{cartCount}</span>}
            <span className="text-[9px] md:text-[10px] mt-0.5 hidden sm:block">Cart</span>
          </Link>

          {/* Profile */}
          <Link href="/profile" className="flex flex-col items-center w-8 h-8 md:w-10 md:h-10">
            <User size={20} />
            <span className="text-[9px] md:text-[10px] mt-0.5 hidden sm:block">Account</span>
          </Link>

          {/* Mobile menu */}
          <button className="lg:hidden w-8 h-8 flex items-center justify-center" onClick={() => setOpen(!open)} aria-label="Toggle Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="lg:hidden bg-white border-t p-4 flex flex-col gap-3 text-base font-medium">
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

"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Heart, User, Search, Menu, X } from "lucide-react";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAuth } from "@/store/AuthContext";
import { useCart } from "@/store/CartContext";
import { useWishlist } from "@/store/WishlistContext";
import { isAdmin } from "@/lib/admin";
import React from "react";

function Header() {
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(false);

  const { items: cartItems = [] } = useCart() || {};
  const { wishlist = [] } = useWishlist() || {};
  const { user, loading } = useAuth();
  const isAdminUser = useMemo(() => isAdmin(user), [user]);

  // Counts
  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.qty || 1), 0),
    [cartItems]
  );
  const wishCount = useMemo(() => wishlist.length, [wishlist]);

  // Bump animation
  const prevCartRef = useRef(cartCount);
  useEffect(() => {
    if (prevCartRef.current !== cartCount) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 380);
      prevCartRef.current = cartCount;
      return () => clearTimeout(t);
    }
  }, [cartCount]);

  const toggleMenu = useCallback(() => setOpen((p) => !p), []);

  if (loading) {
    return (
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="page-container flex items-center justify-between py-3 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="bg-gray-300 rounded-full w-10 h-10" />
            <div className="bg-gray-300 h-6 w-24 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-gray-300 rounded-full w-8 h-8" />
            <div className="bg-gray-300 rounded-full w-8 h-8" />
            <div className="bg-gray-300 rounded-full w-8 h-8" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
      <div
        className="
          page-container flex items-center
          gap-2 sm:gap-4 md:gap-6
          py-1 sm:py-2 md:py-3
        "
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <Image
            src="/logo.png"
            alt="Warea Logo"
            width={44}
            height={44}
            className="object-contain w-9 h-9 sm:w-10 sm:h-10 md:w-[60px] md:h-[60px]"
          />
          <span className="hidden sm:inline text-xl md:text-3xl font-serif font-bold tracking-wide">
            WAREA
          </span>
        </Link>

        {/* Navigation (desktop/tablet) */}
        <nav className="hidden md:flex gap-8 text-base font-medium flex-1">
          <Link href="/">Home</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/help">Help</Link>

          {user && isAdminUser && (
            <div className="flex items-center gap-3 ml-auto">
              <AdminSidebar />
            </div>
          )}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-5 ml-auto flex-shrink-0">
          {/* Search (visible on mobile now; label from sm+) */}
          <Link
            href="/search"
            className="flex flex-col items-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10"
          >
            <Search size={18} />
            <span className="hidden sm:block text-[9px] md:text-[10px] mt-0.5">
              Search
            </span>
          </Link>

          {/* Wishlist */}
          <Link
            href="/wishlist"
            className="relative flex flex-col items-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10"
          >
            <Heart size={18} />
            {wishCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] rounded-full px-[3px] min-w-[16px] h-[16px] flex items-center justify-center">
                {wishCount}
              </span>
            )}
            <span className="hidden sm:block text-[9px] md:text-[10px] mt-0.5">
              Wishlist
            </span>
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="relative flex flex-col items-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10"
          >
            <span className={`${bump ? "cart-bump" : ""} inline-flex`}>
              <ShoppingBag size={18} />
            </span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-[9px] rounded-full px-[3px] min-w-[16px] h-[16px] flex items-center justify-center">
                {cartCount}
              </span>
            )}
            <span className="hidden sm:block text-[9px] md:text-[10px] mt-0.5">
              Cart
            </span>
          </Link>

          {/* Profile */}
          <div className="relative flex flex-col items-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10">
            <Link href="/profile">
              <User size={18} />
            </Link>
            {/* Show Admin badge only from md up to keep mobile clean */}
            {user && isAdminUser && (
              <span className="hidden md:block absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] bg-yellow-200 text-yellow-700 px-1 rounded">
                Admin
              </span>
            )}
          </div>

          {/* Mobile Menu */}
          <button
            className="md:hidden w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center"
            onClick={toggleMenu}
            aria-label="Toggle Menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="md:hidden bg-white border-t p-4 flex flex-col gap-3 text-base font-medium">
          {["/", "/shop", "/about", "/contact", "/help", "/profile"].map((link) => (
            <Link key={link} href={link} onClick={toggleMenu}>
              {link === "/" ? "Home" : link.replace("/", "").toUpperCase()}
            </Link>
          ))}
          {user && isAdminUser && (
            <>
              <hr className="my-2" />
              <span className="text-gray-500 text-sm font-medium">Admin Access</span>
              <Link href="/admin/dashboard" onClick={toggleMenu}>Dashboard</Link>
              <Link href="/admin/orders" onClick={toggleMenu}>Orders</Link>
              <Link href="/admin/products" onClick={toggleMenu}>Manage Products</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default React.memo(Header);

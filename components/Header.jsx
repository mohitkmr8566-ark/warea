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

  // 🟢 ADD THESE TWO LINES
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ✅ Avoid recalculations every render
  const isAdminUser = useMemo(() => isAdmin(user), [user]);
  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.qty || 1), 0),
    [cartItems]
  );
  const wishCount = useMemo(() => wishlist.length, [wishlist]);

  // ✅ Cart Bump Animation (safe)
  const prevCartRef = useRef(cartCount);
  useEffect(() => {
    // Only run bump logic on the client
    if (mounted && prevCartRef.current !== cartCount) {
      setBump(true);
      const timer = setTimeout(() => setBump(false), 380);
      prevCartRef.current = cartCount;
      return () => clearTimeout(timer);
    } else if (!mounted) {
      // Ensure prevRef is in sync on first client render
      prevCartRef.current = cartCount;
    }
  }, [cartCount, mounted]);

  // ✅ Stable Toggle Menu (no re-creation per render)
  const toggleMenu = useCallback(() => setOpen((prev) => !prev), []);

  // ✅ Skeleton for Auth Loading (prevents layout flicker)
  // 🟢 2. MODIFY THE LOADING SKELETON
  // We check for `loading` OR `!mounted`

  if (loading || !mounted) {
    return (
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        {/* This skeleton matches the real header's inner div for a perfect hydration match */}
        <div className="w-full mx-auto px-4 sm:px-6 md:px-10 flex items-center justify-between gap-2 sm:gap-4 py-2 md:py-3 animate-pulse">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="bg-gray-300 rounded-full w-9 h-9 sm:w-10 sm:h-10 md:w-[60px] md:h-[60px]" />
            <div className="hidden sm:inline bg-gray-300 h-6 w-24 rounded" />
          </div>
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5 flex-shrink-0">
            <div className="bg-gray-300 rounded-lg w-10 h-8" />
            <div className="bg-gray-300 rounded-lg w-10 h-8" />
            <div className="bg-gray-300 rounded-lg w-10 h-8" />
            <div className="bg-gray-300 rounded-full w-8 h-8" />
            <div className="md:hidden bg-gray-300 rounded-full w-8 h-8" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm w-full">
      <div className="w-full mx-auto px-4 sm:px-6 md:px-10 flex items-center justify-between gap-2 sm:gap-4 py-3 md:py-3">

        {/* ✅ Logo - No hydration risk */}
        <Link href="/" prefetch={false} className="flex items-center gap-2 flex-shrink-0">
          <Image
            src="/logo.png"
            alt="Warea Logo"
            width={44}
            height={44}
            priority
            className="object-contain w-9 h-9 sm:w-10 sm:h-10 md:w-[60px] md:h-[60px]"
          />
          <span className="hidden sm:inline text-xl md:text-3xl font-serif font-bold tracking-wide">
            WAREA
          </span>
        </Link>

        {/* ✅ Desktop Navigation */}
        <nav className="hidden md:flex gap-8 text-base font-medium flex-1">
          {["/", "/shop", "/about", "/contact", "/help"].map((link) => (
            <Link key={link} href={link} prefetch={false}>
              {link === "/" ? "Home" : link.replace("/", "").toUpperCase()}
            </Link>
          ))}

          {/* Admin Sidebar only if role = admin */}
          {user && isAdminUser && (
            <div className="ml-auto">
              <AdminSidebar />
            </div>
          )}
        </nav>

        {/* ✅ Right Icons */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-5 flex-shrink-0">

          <Link href="/search" prefetch={false} className="icon-btn">
            <Search size={18} />
            <span className="hidden sm:block text-[9px] md:text-[10px] mt-0.5">Search</span>
          </Link>

          <Link href="/wishlist" prefetch={false} className="icon-btn relative">
            <Heart size={18} />
            {mounted && wishCount > 0 && <span className="badge">{wishCount}</span>}
            <span className="hidden sm:block text-[9px] md:text-[10px] mt-0.5">Wishlist</span>
          </Link>

          <Link href="/cart" prefetch={false} className="icon-btn relative">
            <span className={`${bump ? "cart-bump" : ""} inline-flex`}>
              <ShoppingBag size={18} />
            </span>
            {mounted && cartCount > 0 && <span className="badge">{cartCount}</span>}
            <span className="hidden sm:block text-[9px] md:text-[10px] mt-0.5">Cart</span>
          </Link>

          <Link href="/profile" prefetch={false} className="icon-btn relative">
            <User size={18} />
            {user && isAdminUser && (
              <span className="hidden md:block absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] bg-yellow-200 text-yellow-800 px-1 rounded">
                Admin
              </span>
            )}
          </Link>

          {/* ✅ Mobile Menu Toggle */}
          <button onClick={toggleMenu} className="md:hidden icon-btn" aria-label="Toggle Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ✅ Mobile Navigation Dropdown */}
      {open && mounted && (
        <div className="md:hidden bg-white border-t p-4 flex flex-col gap-3 text-base font-medium">
          {["/", "/shop", "/about", "/contact", "/help", "/profile"].map((link) => (
            <Link key={link} href={link} onClick={toggleMenu} prefetch={false}>
              {link === "/" ? "Home" : link.replace("/", "").toUpperCase()}
            </Link>
          ))}
          {user && isAdminUser && (
            <>
              <hr className="my-2" />
              <span className="text-gray-500 text-sm">Admin Access</span>
              <Link href="/admin/dashboard" onClick={toggleMenu} prefetch={false}>Dashboard</Link>
              <Link href="/admin/orders" onClick={toggleMenu} prefetch={false}>Orders</Link>
              <Link href="/admin/products" onClick={toggleMenu} prefetch={false}>Products</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default React.memo(Header);

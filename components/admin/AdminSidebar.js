"use client";

import Link from "next/link";
import { useAuth } from "@/store/AuthContext";
import { useFlaggedReviewCount } from "@/hooks/useFlaggedReviewCount";

export default function AdminSidebar() {
  const { user, loading } = useAuth();

  // only mark admin true after auth loaded
  const isAdmin =
    !loading &&
    user &&
    ["mohitkmr8566@gmail.com", "warea.admin@gmail.com"].includes(user.email);

  const flaggedCount = useFlaggedReviewCount(isAdmin);

  return (
    <nav className="flex items-center gap-6">
      {/* Other admin links */}
      <Link href="/admin/dashboard" className="text-sm text-blue-600 hover:text-blue-800">
        Dashboard
      </Link>
      <Link href="/admin/orders" className="text-sm text-blue-600 hover:text-blue-800">
        Orders
      </Link>
      <Link href="/admin/products" className="text-sm text-blue-600 hover:text-blue-800">
        Products
      </Link>

      {/* Reviews (with badge) */}
      {isAdmin && (
        <Link href="/admin/reviews" className="relative flex items-center text-sm text-blue-600 hover:text-blue-800">
          🧾 Reviews
          {flaggedCount > 0 && (
            <span className="absolute -top-2 -right-3 bg-red-600 text-white text-xs font-semibold rounded-full px-1.5 py-0.5">
              {flaggedCount}
            </span>
          )}
        </Link>
      )}
    </nav>
  );
}

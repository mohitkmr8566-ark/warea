// components/admin/AdminLayout.jsx
import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Image as ImageIcon,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/store/AuthContext";
import { useEffect, useState } from "react";
import { isAdmin } from "@/lib/admin";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const adminCheck = isAdmin(user);
    console.log("AdminLayout → Admin check:", user?.email, adminCheck);

    if (adminCheck) {
      setVerified(true);
    } else {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || !verified) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-lg">
        Checking admin access...
      </div>
    );
  }

  const links = [
    { name: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Orders", href: "/admin/orders", icon: <ShoppingBag size={18} /> },
    { name: "Products", href: "/admin/products", icon: <Package size={18} /> },
    { name: "Hero Banners", href: "/admin/hero", icon: <ImageIcon size={18} /> },
  ];

  const isActive = (path) => router.pathname === path;

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 w-64 h-screen bg-[#0d0d0d] text-gray-200 flex flex-col border-r border-gray-800 shadow-xl z-40">
        {/* Logo */}
        <div className="flex items-center justify-center py-6 border-b border-gray-800">
          <Link
            href="/"
            className="text-2xl font-serif font-bold text-white tracking-wide hover:text-amber-400 transition"
          >
            WAREA<span className="text-amber-400 ml-1">Admin</span>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                isActive(link.href)
                  ? "bg-amber-500 text-black shadow-md"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-red-600 hover:text-white transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8 min-h-screen overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}

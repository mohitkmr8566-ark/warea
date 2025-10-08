// components/admin/AdminLayout.jsx
import Link from "next/link";
import { useRouter } from "next/router";
import { LayoutDashboard, ShoppingBag, Package, LogOut } from "lucide-react";
import { useAuth } from "@/store/AuthContext";
import { useEffect, useState } from "react";
import { isAdmin } from "@/lib/admin";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const [verified, setVerified] = useState(false); // ✅ controls render only once

  useEffect(() => {
    if (loading) return; // wait for auth to finish

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

  // show loader while verifying
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
  ];

  const active = (path) =>
    router.pathname === path
      ? "bg-gray-800 text-white"
      : "text-gray-300 hover:bg-gray-800 hover:text-white";

  return (
    <div className="relative min-h-screen bg-gray-50">
      <aside className="fixed top-0 left-0 w-64 h-screen bg-[#111] text-gray-200 flex flex-col border-r border-gray-800 z-40">
        <div className="flex items-center justify-center py-5 border-b border-gray-800">
          <Link href="/" className="text-2xl font-serif font-bold text-white tracking-wide">
            WAREA<span className="text-blue-400 ml-1">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-md transition ${active(link.href)}`}
            >
              {link.icon}
              <span>{link.name}</span>
            </Link>
          ))}
        </nav>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-t border-gray-800 hover:bg-red-600 hover:text-white transition"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      <main className="ml-64 p-8 min-h-screen overflow-y-auto">{children}</main>
    </div>
  );
}

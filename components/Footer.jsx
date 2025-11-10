import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const currentYear = new Date().getFullYear(); // ✅ Prevent hydration mismatch by computing once

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-16 w-full max-w-full overflow-hidden">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10
        grid grid-cols-1 md:grid-cols-4 gap-8 text-gray-700">

        {/* Brand / About */}
        <div className="min-w-0">
          <h3 className="text-xl font-bold mb-4 font-serif">Warea</h3>
          <p className="text-sm leading-relaxed">
            Handcrafted jewellery for every moment — minimal, graceful, and forever timeless.
          </p>
        </div>

        {/* Quick Links */}
        <div className="min-w-0">
          <h4 className="font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" prefetch={false}>Home</Link></li>
            <li><Link href="/shop" prefetch={false}>Shop</Link></li>
            <li><Link href="/about" prefetch={false}>About Us</Link></li>
            <li><Link href="/contact" prefetch={false}>Contact</Link></li>
            <li><Link href="/help" prefetch={false}>Help</Link></li>
          </ul>
        </div>

        {/* Policies */}
        <div className="min-w-0">
          <h4 className="font-semibold mb-3">Policies</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/shipping-policy" prefetch={false}>Shipping Policy</Link></li>
            <li><Link href="/return-policy" prefetch={false}>Return Policy</Link></li>
            <li><Link href="/privacy-policy" prefetch={false}>Privacy Policy</Link></li>
            <li><Link href="/terms-and-conditions" prefetch={false}>Terms & Conditions</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="min-w-0">
          <h4 className="font-semibold mb-3">Join Our Newsletter</h4>
          <form
            className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:items-center w-full"
            onSubmit={(e) => e.preventDefault()} // ✅ Prevents unwanted refresh
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2
              text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md
              hover:bg-gray-700 transition whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>

          {/* Social Icons */}
          <div className="flex gap-4 mt-4 text-gray-600">
            <Link href="#" aria-label="Facebook" prefetch={false}><Facebook size={20} /></Link>
            <Link href="#" aria-label="Instagram" prefetch={false}><Instagram size={20} /></Link>
            <Link href="#" aria-label="Twitter" prefetch={false}><Twitter size={20} /></Link>
            <Link href="#" aria-label="YouTube" prefetch={false}><Youtube size={20} /></Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t text-center py-4 text-sm text-gray-500 w-full">
        © {currentYear} Warea. All rights reserved.
      </div>
    </footer>
  );
}

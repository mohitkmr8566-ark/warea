import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-16">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-gray-700">
        
        {/* Brand / About */}
        <div>
          <h3 className="text-xl font-bold mb-4 font-serif">Warea</h3>
          <p className="text-sm leading-relaxed">
            Handcrafted jewellery for every moment — minimal, graceful, and forever timeless.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/shop">Shop</Link></li>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>

        {/* Policies */}
        <div>
          <h4 className="font-semibold mb-3">Policies</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="#">Shipping Policy</Link></li>
            <li><Link href="#">Return Policy</Link></li>
            <li><Link href="#">Privacy Policy</Link></li>
            <li><Link href="#">Terms & Conditions</Link></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-semibold mb-3">Join Our Newsletter</h4>
          <form className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t text-center py-4 text-sm text-gray-500">
        © {new Date().getFullYear()} Warea. All rights reserved.
      </div>
    </footer>
  );
}


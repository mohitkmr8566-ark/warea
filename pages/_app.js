// pages/_app.js
import "@/styles/globals.css";

import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/store/CartContext";
import { WishlistProvider } from "@/store/WishlistContext";
import { AuthProvider } from "@/store/AuthContext";
import { Toaster } from "react-hot-toast";

export default function MyApp({ Component, pageProps }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <AuthProvider>
          <Toaster position="top-right" />
          <div className="min-h-screen flex flex-col">
            <TopBar />        {/* single TopBar, non-sticky */}
            <Header />        {/* sticky header (nav + icons) */}
            <main className="flex-1 page-container">
              <Component {...pageProps} />
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </WishlistProvider>
    </CartProvider>
  );
}

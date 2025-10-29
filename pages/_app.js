// pages/_app.js
import "@/styles/globals.css";
import "react-loading-skeleton/dist/skeleton.css"; // 🆕 Skeleton Loader Styles

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/store/CartContext";
import { WishlistProvider } from "@/store/WishlistContext";
import { AuthProvider } from "@/store/AuthContext";
import { Toaster } from "react-hot-toast";

export default function MyApp({ Component, pageProps, router }) {
  const isHomePage = router?.pathname === "/"; // detect homepage

  return (
    <CartProvider>
      <WishlistProvider>
        <AuthProvider>
          <Toaster position="top-right" />
          <div className="min-h-screen flex flex-col">
            <Header />
            {isHomePage ? (
              // 👇 Full width for homepage (Hero banner)
              <main className="flex-1 w-full">
                <Component {...pageProps} />
              </main>
            ) : (
              // 👇 Normal container for other pages
              <main className="flex-1 page-container">
                <Component {...pageProps} />
              </main>
            )}
            <Footer />
          </div>
        </AuthProvider>
      </WishlistProvider>
    </CartProvider>
  );
}

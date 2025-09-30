// pages/_app.js
import "@/styles/globals.css";

import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/store/CartContext";
import { WishlistProvider } from "@/store/WishlistContext";

export default function MyApp({ Component, pageProps }) {
  return (
    <CartProvider>
      <WishlistProvider>
        <div className="min-h-screen flex flex-col">
          <TopBar />
          <Header />
          <main className="flex-1 page-container">
            <Component {...pageProps} />
          </main>
          <Footer />
        </div>
      </WishlistProvider>
    </CartProvider>
  );
}

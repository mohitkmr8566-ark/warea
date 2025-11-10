// ✅ pages/_app.js (FINAL & STABLE)
import "@/styles/globals.css";
import "react-loading-skeleton/dist/skeleton.css";

import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import Head from "next/head";
import { DefaultSeo } from "next-seo";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/store/CartContext";
import { WishlistProvider } from "@/store/WishlistContext";
import { AuthProvider } from "@/store/AuthContext";
import { Toaster } from "react-hot-toast";

import SEO from "../next-seo.config";

export default function MyApp({ Component, pageProps, router }) {
  // ✅ No conditional DOM classes (prevents hydration mismatches)
  const isHomePage = router?.pathname === "/";

  // ✅ Safe base URL detection (SSR + CSR)
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_BASE_URL || "https://warea.vercel.app"
      : window.location.origin;

  const GA_ID = process.env.NEXT_PUBLIC_GTAG_ID || "G-XXXXXXXXXX";

  return (
    <>
      {/* ✅ Global Meta Tags + WebSite JSON-LD */}
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="index,follow" />
        <meta name="theme-color" content="#fef3c7" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/* No preload of local static assets (prevents hydration reload loops) */}

        {/* ✅ Basic Website Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              url: baseUrl,
              name: "Warea Jewellery",
              potentialAction: {
                "@type": "SearchAction",
                target: `${baseUrl}/search?query={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </Head>

      {/* ✅ Default SEO Config Applied to All Pages */}
      <DefaultSeo {...SEO} />

      {/* ✅ Google Analytics (safe, CSR only) */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { page_path: window.location.pathname });
        `}
      </Script>

      {/* ✅ Global App Providers & Layout */}
      <CartProvider>
        <WishlistProvider>
          <AuthProvider>
            <Toaster position="top-right" />
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className={isHomePage ? "flex-1 w-full" : "flex-1 page-container"}>
                <Component {...pageProps} />
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </WishlistProvider>
      </CartProvider>

      <SpeedInsights />
    </>
  );
}

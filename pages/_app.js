// pages/_app.js
import "@/styles/globals.css";
import "react-loading-skeleton/dist/skeleton.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/store/CartContext";
import { WishlistProvider } from "@/store/WishlistContext";
import { AuthProvider } from "@/store/AuthContext";
import { Toaster } from "react-hot-toast";

// ✅ SEO Imports
import Head from "next/head";
import { DefaultSeo } from "next-seo";
import SEO from "../next-seo.config";

export default function MyApp({ Component, pageProps, router }) {
  const isHomePage = router?.pathname === "/";
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000");

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Warea Creations",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [
      "https://www.instagram.com/wareacreations",
      "https://www.facebook.com/wareacreations",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-XXXXXXXXXX",
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: "en",
    },
  };

  return (
    <>
      {/* ✅ Global SEO + Sitemap + Schema */}
      <Head>
        <link
          rel="sitemap"
          type="application/xml"
          href={`${baseUrl}/api/sitemap.xml`}
        />
        <meta name="robots" content="index,follow" />
        <meta name="theme-color" content="#fef3c7" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* WebSite Schema */}
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
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
      </Head>

      {/* ✅ Default SEO Configuration */}
      <DefaultSeo {...SEO} />

      <CartProvider>
        <WishlistProvider>
          <AuthProvider>
            <Toaster position="top-right" />
            <div className="min-h-screen flex flex-col">
              <Header />
              {isHomePage ? (
                <main className="flex-1 w-full">
                  <Component {...pageProps} />
                </main>
              ) : (
                <main className="flex-1 page-container">
                  <Component {...pageProps} />
                </main>
              )}
              <Footer />
            </div>
          </AuthProvider>
        </WishlistProvider>
      </CartProvider>
    </>
  );
}

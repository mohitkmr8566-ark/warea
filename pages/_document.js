// ✅ pages/_document.js (FINAL & SAFE)
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" className="scroll-smooth">
      <Head>
        {/* ✅ Performance: Preconnect only (safe for hydration) */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* ✅ Google Fonts optimized */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* ❌ Removed hero-banner preload — caused warnings & reload loops */}
        {/*
          <link rel="preload" as="image" href="/hero-banner.webp" type="image/webp" />
        */}

        {/* ✅ Basic meta only (viewport must stay in _app.js) */}
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#fef3c7" />
      </Head>

      {/* ✅ Body must be stable — no conditional logic, no hydration suppression */}
      <body className="bg-white text-gray-900 min-h-screen overflow-x-hidden">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

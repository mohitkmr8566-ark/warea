// pages/_document.js
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ✅ Performance: DNS + Connection to Cloudinary */}
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />

        {/* ✅ Font Loading Optimization – Use preconnect only (better than preload+stylesheet spam) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* ✅ Preload Hero Banner (LCP improvement) */}
        <link rel="preload" as="image" href="/hero-banner.webp" type="image/webp" />

        {/* ✅ Meta & Theme */}
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#fef3c7" />
      </Head>

      {/* ✅ Prevent dark mode flash, safe hydration for Next.js */}
      <body className="bg-white text-gray-900" suppressHydrationWarning={true}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

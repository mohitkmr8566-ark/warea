// pages/_document.js
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ✅ Performance: Preconnect to Cloudinary for faster image loading */}
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />

        {/* ✅ Google Fonts Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* ✅ Preload LCP Hero Banner */}
        <link rel="preload" as="image" href="/hero-banner.webp" type="image/webp" />

        {/* ✅ General meta tags */}
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#fef3c7" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* ✅ Prevent layout shift or dark mode flash */}
      <body className="bg-white text-gray-900 min-h-screen overflow-x-hidden" suppressHydrationWarning>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}


import Head from "next/head"; // ✅ Keep SSR-friendly
import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection";
import ProductGrid from "@/components/ProductGrid";
import { motion } from "framer-motion";

// ✅ Import reusable SEO helpers
import {
  getBaseUrl,
  getOrganizationSchema,
  getWebsiteSchema,
  getBreadcrumbSchema,
  getProductSchemas,
  getSiteNavSchema,   // ✅ add this line
} from "@/lib/seoSchemas";

export default function HomePage() {
  const baseUrl = getBaseUrl();

  // 🛍️ Featured products for schema
  const featuredProducts = [
    {
      name: "Gold Plated Heart Earrings",
      image: `${baseUrl}/products/heart-earrings.jpg`,
      price: "249",
      ratingValue: 4.8,
      reviewCount: 112,
      url: `${baseUrl}/product/gold-plated-heart-earrings`,
    },
    {
      name: "Heart Stud Earrings",
      image: `${baseUrl}/products/heart-stud.jpg`,
      price: "285",
      ratingValue: 4.6,
      reviewCount: 98,
      url: `${baseUrl}/product/heart-stud-earrings`,
    },
    {
      name: "Gold Plated Flower Earrings",
      image: `${baseUrl}/products/flower-earrings.jpg`,
      price: "299",
      ratingValue: 4.9,
      reviewCount: 157,
      url: `${baseUrl}/product/gold-plated-flower-earrings`,
    },
  ];

  // ✅ Combine all schema generators
  const schemas = [
    getOrganizationSchema(baseUrl),
    getWebsiteSchema(baseUrl),
    getBreadcrumbSchema(baseUrl),
    getSiteNavSchema(baseUrl), // ⬅ add this

    ...getProductSchemas(baseUrl, featuredProducts),
  ];

  return (
    <>
      <Head>
        {/* Networking hints */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* Preload hero image if it's used in the first viewport (swap path if different) */}
        <link
          rel="preload"
          as="image"
          href="/hero-banner.webp"
          imagesrcset="/hero-banner.webp"
          imageSizes="100vw"
          type="image/webp"
        />

        {/* Preload primary font (adjust path/name if needed) */}
        <link
          rel="preload"
          as="font"
          href="/fonts/serif.woff2"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* Basic Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {/* ⬇ Nice extras */}
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <meta name="theme-color" content="#111111" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="alternate" hrefLang="x-default" href={baseUrl} />
        <link rel="alternate" hrefLang="en-in" href={baseUrl} />

        {/* ✅ Meta + SEO Tags */}
        <title>
          Warea Jewellery | Handcrafted Gold & Silver Jewellery Online in India
        </title>
        <meta
          name="description"
          content="Buy certified gold & silver jewellery online from Warea. Explore minimal, elegant, and anti-tarnish designs handcrafted with precision."
        />
        <meta
          name="keywords"
          content="warea, jewellery, gold, silver, handcrafted jewellery, earrings, necklaces, bracelets, BIS hallmark, buy jewellery online"
        />
        <link rel="canonical" href={baseUrl} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Warea Jewellery | Elegant Gold & Silver Jewellery"
        />
        <meta
          property="og:description"
          content="Explore premium handcrafted gold & silver jewellery from Warea Creations — certified, hallmarked, and timeless."
        />
        <meta property="og:url" content={baseUrl} />
        <meta property="og:image" content={`${baseUrl}/logo.png`} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Warea Jewellery | Elegant Gold & Silver Jewellery"
        />
        <meta
          name="twitter:description"
          content="Discover timeless handcrafted gold & silver jewellery at Warea Creations."
        />
        <meta name="twitter:image" content={`${baseUrl}/logo.png`} />

        {/* ✅ Inject all JSON-LD Schemas */}
        {schemas.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </Head>

      {/* Hero */}
      <Hero />

      {/* Categories */}
      <section className="py-10 sm:py-14 border-t border-gray-100 animate-fadeIn">
        <div className="page-container">
          <CategorySection />
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-10 sm:py-14 border-t border-gray-100 animate-fadeIn">
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-wide mb-8">
              Featured Products
            </h2>
          </motion.div>
          <ProductGrid />
        </div>
      </section>
    </>
  );
}

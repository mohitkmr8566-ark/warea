import Head from "next/head";
import dynamic from "next/dynamic";
import CategorySection from "@/components/CategorySection";
import ProductGrid from "@/components/ProductGrid";
import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  getBaseUrl,
  getOrganizationSchema,
  getWebsiteSchema,
  getBreadcrumbSchema,
  getProductSchemas,
  getSiteNavSchema,
} from "@/lib/seoSchemas";

// ✅ Client-side only Hero (Swiper heavy, avoids hydration issues)
const Hero = dynamic(() => import("@/components/Hero"), { ssr: false });

export default function HomePage() {
  const baseUrl = getBaseUrl();

  // ✅ Static featured product data (used only for schema and rendering)
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

  // ✅ Memoized structured data → prevents re-renders
  const schemas = useMemo(
    () => [
      getOrganizationSchema(baseUrl),
      getWebsiteSchema(baseUrl),
      getBreadcrumbSchema(baseUrl),
      getSiteNavSchema(baseUrl),
      ...getProductSchemas(baseUrl, featuredProducts),
    ],
    [baseUrl]
  );

  return (
    <>
      <Head>
        {/* ✅ Keep only page-specific meta tags here (others moved to _app.js) */}
        <title>
          Warea Jewellery | Handcrafted Gold & Silver Jewellery Online in India
        </title>
        <meta
          name="description"
          content="Buy certified gold & silver jewellery online from Warea. Explore minimal, elegant, and anti-tarnish designs handcrafted with precision."
        />
        <link rel="canonical" href={baseUrl} />

        {/* ✅ Preloads for performance */}
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preload" as="image" href="/hero-banner.webp" />

        {/* ✅ Inject schema.org structured data safely */}
        {schemas.map((schema, i) => (
          <script key={i} type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        ))}
      </Head>

      {/* ✅ Page Content */}
      <div className="w-full">
        {/* Hero (lazy, no SSR) */}
        <div className="w-full overflow-hidden">
          <Hero />
        </div>

        {/* Categories */}
        <section className="py-10 sm:py-14 border-t border-gray-100 w-full overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <CategorySection />
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-8 sm:py-14 border-t border-gray-100 w-full overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-xl sm:text-3xl font-serif font-bold tracking-wide mb-6 sm:mb-8">
                Featured Products
              </h2>
            </motion.div>
            <ProductGrid onlyFeatured />
          </div>
        </section>
      </div>
    </>
  );
}

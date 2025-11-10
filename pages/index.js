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

// ✅ ADD THIS ENTIRE BLOCK at the top with your other imports
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ✅ Client-side only Hero (Swiper heavy, avoids hydration issues)
const Hero = dynamic(() => import("@/components/Hero"), { ssr: false });

// ✅ STEP 1: Add { initialProducts } here
export default function HomePage({ initialProducts = [] }) {
  const baseUrl = getBaseUrl();

  // ✅ This 'featuredProducts' array is now only used for SEO schema
  const featuredProductsForSchema = [
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
      // ✅ We use the static schema list, not the live products
      ...getProductSchemas(baseUrl, featuredProductsForSchema),
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
            <ProductGrid onlyFeatured initialProducts={initialProducts} />
          </div>
        </section>
      </div>
    </>
  );
}

// ✅ STEP 3: ADD THIS ENTIRE FUNCTION to the bottom of the file
export async function getServerSideProps() {
  try {
    // Create a query to get only "isFeatured: true" products
    const q = query(
      collection(db, "products"),
      where("isFeatured", "==", true),
      orderBy("createdAt", "desc"),
      limit(8) // Get up to 8 featured products
    );

    const snapshot = await getDocs(q);

    // Format the products for the page
    const featuredProducts = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to plain numbers
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : null,
        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : null,
      };
    });

    // Pass the products as props to the HomePage component
    return {
      props: {
        initialProducts: featuredProducts,
      },
    };
  } catch (err) {
    console.error("❌ SSR Error (homepage):", err);
    // Always return props, even if empty, to avoid errors
    return {
      props: { initialProducts: [] },
    };
  }
}

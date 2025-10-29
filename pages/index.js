"use client";

import Head from "next/head";
import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection";
import ProductGrid from "@/components/ProductGrid";
import { motion } from "framer-motion";

export default function HomePage() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  /* ---------------------- JSON-LD SCHEMAS ---------------------- */
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Warea Creations",
    legalName: "Sarmistha Biswas (Warea Creations)",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    foundingDate: "2024",
    founder: {
      "@type": "Person",
      name: "Sarmistha Biswas",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-9876543210",
      contactType: "customer service",
      areaServed: "IN",
      availableLanguage: ["en", "hi"],
    },
    sameAs: [
      "https://www.instagram.com/warea",
      "https://www.facebook.com/warea",
      "https://www.youtube.com/@warea",
      "https://x.com/warea",
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "120 D1, 2nd Floor, SK Medical Store, Nauraiya Khera",
      addressLocality: "Kanpur Nagar",
      addressRegion: "Uttar Pradesh",
      postalCode: "208022",
      addressCountry: "IN",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Warea Jewellery",
    url: baseUrl,
    description:
      "Shop exquisite handcrafted gold & silver jewellery online from Warea — minimal, elegant, and BIS-certified designs.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/search?query={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
    ],
  };

  /* ---------------------- META TAGS ---------------------- */
  return (
    <>
      <Head>
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
        <meta property="og:title" content="Warea Jewellery | Elegant Gold & Silver Jewellery" />
        <meta
          property="og:description"
          content="Explore premium handcrafted gold & silver jewellery from Warea Creations — certified, hallmarked, and timeless."
        />
        <meta property="og:url" content={baseUrl} />
        <meta property="og:image" content={`${baseUrl}/logo.png`} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Warea Jewellery | Elegant Gold & Silver Jewellery" />
        <meta
          name="twitter:description"
          content="Discover timeless handcrafted gold & silver jewellery at Warea Creations."
        />
        <meta name="twitter:image" content={`${baseUrl}/logo.png`} />

        {/* JSON-LD Schemas */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
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
            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-wide text-center mb-8">
              Featured Products
            </h2>
          </motion.div>
          <ProductGrid />
        </div>
      </section>
    </>
  );
}

// /lib/seoSchemas.js

// ✅ Base URL utility
export const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
};

// ✅ Organization schema
export const getOrganizationSchema = (baseUrl) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Warea Creations",
  legalName: "Sarmistha Biswas (Warea Creations)",
  url: baseUrl,
  logo: `${baseUrl}/logo.png`,
  foundingDate: "2024",
  founder: { "@type": "Person", name: "Sarmistha Biswas" },
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
});

// ✅ Website schema
export const getWebsiteSchema = (baseUrl) => ({
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
});

// ✅ Breadcrumb schema
export const getBreadcrumbSchema = (baseUrl, path = []) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
    ...path.map((p, i) => ({
      "@type": "ListItem",
      position: i + 2,
      name: p.name,
      item: `${baseUrl}${p.url}`,
    })),
  ],
});

// ✅ Product schema generator (for homepage or lists)
export const getProductSchemas = (baseUrl, products = []) =>
  products.map((p) => ({
    "@context": "https://schema.org/",
    "@type": "Product",
    name: p.name,
    image: [p.image],
    description: `${p.name} handcrafted with love at Warea Creations.`,
    brand: { "@type": "Brand", name: "Warea Creations" },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: p.ratingValue,
      reviewCount: p.reviewCount,
    },
    offers: {
      "@type": "Offer",
      url: p.url,
      priceCurrency: "INR",
      price: p.price,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Warea Creations" },
    },
  }));

// ✅ Product Page Schema Generator (for product/[id].js)
export const getProductPageSchemas = (
  baseUrl,
  product = {},
  reviews = [],
  ratingValue = 4.8,
  reviewCount = 126
) => {
  if (!baseUrl || !product?.id) return [];

  const productUrl = `${baseUrl}/product/${product.id}`;
  const desc =
    product.description?.slice(0, 150) ||
    `Shop ${product.title} by Warea — handcrafted, anti-tarnish, BIS-certified jewellery with fast delivery.`;

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "@id": productUrl,
    name: product.title,
    sku: product.sku || product.id,
    brand: { "@type": "Brand", name: "Warea Creations" },
    category: product.category || "Jewellery",
    image: product.images?.map((i) => i.url) || [],
    description: desc,
    material: product.material || undefined,
    url: productUrl,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: Number(product.price || 0),
      priceValidUntil: "2026-12-31",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Warea Creations", url: baseUrl },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: Number(ratingValue || 4.8),
      reviewCount: Number(reviewCount || 126),
    },
    review:
      reviews?.length > 0
        ? reviews.slice(0, 5).map((r) => ({
            "@type": "Review",
            author: { "@type": "Person", name: r.userName || "Customer" },
            reviewRating: {
              "@type": "Rating",
              ratingValue: r.rating,
              bestRating: "5",
              worstRating: "1",
            },
            reviewBody: r.comment,
            datePublished: r.createdAt
              ? new Date(r.createdAt).toISOString()
              : undefined,
          }))
        : undefined,
  };

  const breadcrumbSchema = getBreadcrumbSchema(baseUrl, [
    { name: "Shop", url: "/shop" },
    ...(product.category
      ? [
          {
            name: product.category,
            url: `/shop?category=${encodeURIComponent(product.category)}`,
          },
        ]
      : []),
    { name: product.title, url: `/product/${product.id}` },
  ]);

  const organizationSchema = getOrganizationSchema(baseUrl);

  return [organizationSchema, breadcrumbSchema, productSchema];
};

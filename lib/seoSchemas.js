// /lib/seoSchemas.js

export const getBaseUrl = () => {
  // Prefer env ALWAYS to keep canonical consistent
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (typeof window !== "undefined") return window.location.origin;
  return "https://warea.vercel.app";
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
    "https://www.instagram.com/warea._official",
    "https://www.facebook.com/wareaofficial",
    "https://www.youtube.com/@warea-k3e",
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

// ✅ Website schema (JUST change the target)
export const getWebsiteSchema = (baseUrl) => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Warea Jewellery",
  url: baseUrl,
  description:
    "Shop exquisite handcrafted gold & silver jewellery online from Warea — minimal, elegant, and BIS-certified designs.",
  potentialAction: {
    "@type": "SearchAction",
    target: `${baseUrl}/search?q={search_term_string}`, // ← use q, not query
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

// ✅ Navigation Schema
export const getSiteNavSchema = (baseUrl) => ({
  "@context": "https://schema.org",
  "@type": "SiteNavigationElement",
  name: ["Shop", "Search", "Wishlist", "Cart", "Profile", "About", "Contact", "Help"],
  url: [
    `${baseUrl}/shop`,
    `${baseUrl}/search`,
    `${baseUrl}/wishlist`,
    `${baseUrl}/cart`,
    `${baseUrl}/profile`,
    `${baseUrl}/about`,
    `${baseUrl}/contact`,
    `${baseUrl}/help`,
  ],
});


// Replace your existing getProductPageSchemas with this function
const availabilityToSchemaUrl = (avail) => {
  const a = (avail || "").toString().toLowerCase();
  if (a.includes("in") || a.includes("instock")) return "https://schema.org/InStock";
  if (a.includes("out") || a.includes("oos") || a.includes("outofstock")) return "https://schema.org/OutOfStock";
  if (a.includes("pre") || a.includes("preorder")) return "https://schema.org/PreOrder";
  return "https://schema.org/InStock";
};

export const getProductPageSchemas = (
  baseUrl,
  product = {},
  reviews = [],
  ratingValue = 4.8,
  reviewCount = 126
) => {
  if (!baseUrl || !product?.id) return [];

  const productUrl = `${baseUrl.replace(/\/$/, "")}/product/${product.id}`;

  const images =
    (product.images || [])
      .map((i) => (typeof i === "string" ? i : i?.url))
      .filter(Boolean) || [`${baseUrl.replace(/\/$/, "")}/products/placeholder.png`];

  const priceNum = Number(product.price ?? product.mrp ?? 0);
  const priceStr = priceNum > 0 ? String(priceNum) : "0";

  const availability = availabilityToSchemaUrl(product.availability || "IN_STOCK");

  const desc =
    product.description?.slice(0, 150) ||
    `Shop ${product.title} by Warea — handcrafted, anti-tarnish, BIS-certified jewellery with fast delivery.`;

  // Core Product object (keeps reviews inside but we also optionally emit AggregateRating separately)
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "@id": productUrl,
    name: product.title || "",
    sku: product.sku || product.id,
    brand: { "@type": "Brand", name: product.brand || "Warea Creations" },
    category: product.category || "Jewellery",
    image: images,
    description: desc,
    material: product.material || undefined,
    url: productUrl,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "INR",
      price: priceStr,
      priceValidUntil: product.priceValidUntil || "2026-12-31",
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Warea Creations", url: baseUrl },
    },
    // include review array here (limited & filtered) — useful for some rich result parsers
    review:
      Array.isArray(reviews) && reviews.length > 0
        ? reviews
            .slice(0, 5)
            .map((r) => {
              const published = r.createdAt
                ? new Date(r.createdAt).toISOString()
                : undefined;
              return {
                "@type": "Review",
                author: { "@type": "Person", name: r.userName || r.userId || "Customer" },
                reviewRating: {
                  "@type": "Rating",
                  ratingValue: String(Number(r.rating || 0)),
                  bestRating: "5",
                  worstRating: "1",
                },
                reviewBody: r.comment || undefined,
                datePublished: published,
              };
            })
            .filter((s) => s.reviewBody || s.datePublished)
        : undefined,
  };

  // Breadcrumb
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
    { name: product.title || "Product", url: `/product/${product.id}` },
  ]);

  // Organization
  const organizationSchema = getOrganizationSchema(baseUrl);

  const output = [organizationSchema, breadcrumbSchema, productSchema];

  // Emit AggregateRating separately if we actually have review stats
  if (Number(reviewCount) > 0 && ratingValue != null) {
    output.push({
      "@context": "https://schema.org/",
      "@type": "AggregateRating",
      itemReviewed: { "@type": "Product", name: product.title || "" },
      ratingValue: Number(ratingValue).toFixed(1),
      reviewCount: Number(reviewCount),
    });
  }

  return output;
};

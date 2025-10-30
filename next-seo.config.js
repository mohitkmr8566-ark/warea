// next-seo.config.js
const baseUrl = "https://warea.in";

export default {
  title: "Warea - Elegant Jewellery for Every Occasion",
  description:
    "Discover handcrafted gold and silver jewellery from Warea Creations. Shop earrings, rings, necklaces, bangles & more with certified purity and nationwide delivery.",
  canonical: baseUrl,
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: baseUrl,
    siteName: "Warea Creations",
    title: "Warea Creations | Elegant Jewellery for Every Occasion",
    description:
      "Premium handcrafted gold and silver jewellery with assured purity and nationwide delivery.",
    images: [
      {
        url: `${baseUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Warea Jewellery Collection",
      },
    ],
  },
  twitter: {
    handle: "@wareacreations",
    site: "@wareacreations",
    cardType: "summary_large_image",
  },
  additionalMetaTags: [
    {
      name: "keywords",
      content:
        "Warea, jewellery, gold, silver, handcrafted jewellery, earrings, rings, necklaces, bangles, online jewellery India",
    },
  ],
  additionalLinkTags: [
    {
      rel: "icon",
      href: "/favicon.ico",
    },
    {
      rel: "apple-touch-icon",
      href: "/apple-touch-icon.png",
      sizes: "180x180",
    },
  ],
};

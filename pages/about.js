import Head from "next/head";
import { getBaseUrl, getOrganizationSchema } from "@/lib/seoSchemas";

export default function AboutPage() {
  const baseUrl = getBaseUrl();

  // ✅ JSON-LD Schema for About Page
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Warea Creations",
    url: `${baseUrl}/about`,
    mainEntity: {
      "@type": "Organization",
      name: "Warea Creations",
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
    },
  };

  return (
    <>
      <Head>
        <title>About Warea Creations | Elegant Jewellery for Every Occasion</title>
        <meta
          name="description"
          content="Discover the story of Warea Creations — a brand blending craftsmanship, minimal design, and timeless jewellery. Learn about our mission, values, and journey."
        />
        <link rel="canonical" href={`${baseUrl}/about`} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="About Warea Creations" />
        <meta
          property="og:description"
          content="Timeless handcrafted jewellery made with passion and precision."
        />
        <meta property="og:image" content={`${baseUrl}/logo.png`} />
        <meta property="og:url" content={`${baseUrl}/about`} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Warea Creations" />
        <meta
          name="twitter:description"
          content="Explore Warea's journey in creating elegant and ethical jewellery."
        />

        {/* ✅ Inject JSON-LD Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([aboutSchema, getOrganizationSchema(baseUrl)]),
          }}
        />
      </Head>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold font-serif text-center mb-8">
          About Warea
        </h1>

        <p className="text-lg text-gray-700 leading-relaxed mb-6 text-center">
          At <span className="font-semibold">Warea</span>, jewellery isn’t just an accessory —
          it’s a memory, a feeling, a personal story. We are passionate about creating
          handcrafted pieces that reflect elegance, emotion, and individuality.
        </p>

        <div className="grid md:grid-cols-2 gap-12 mt-12">
          {/* Story */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="text-gray-600 leading-relaxed">
              Warea began as a small design studio with a vision — to bring minimal yet
              luxurious jewellery to everyday life. What started as handcrafted designs is now
              loved by thousands for its charm, quality, and timeless appeal.
            </p>
          </div>

          {/* Mission */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              To make premium-quality, skin-friendly, and affordable jewellery accessible to
              everyone, while ensuring ethical sourcing, sustainable packaging, and loving
              craftsmanship.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

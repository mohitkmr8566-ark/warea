import Head from "next/head";

export default function AboutPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://warea.in";

  return (
    <>
      <Head>
        <title>About Warea Creations | Elegant Jewellery for Every Occasion</title>
        <meta
          name="description"
          content="Learn about Warea Creations — a jewellery brand that blends craftsmanship, design, and elegance. Discover our story, mission, and ethical commitment."
        />
        <link rel="canonical" href={`${baseUrl}/about`} />
        <meta property="og:title" content="About Warea Creations" />
        <meta
          property="og:description"
          content="Learn about Warea Creations — timeless elegance and sustainable craftsmanship."
        />
        <meta property="og:image" content={`${baseUrl}/logo.png`} />
        <meta property="og:url" content={`${baseUrl}/about`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="About Warea Creations" />
        <meta
          name="twitter:description"
          content="Elegant handcrafted jewellery made with love."
        />
      </Head>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold font-serif text-center mb-8">
          About Warea
        </h1>

        <p className="text-lg text-gray-700 leading-relaxed mb-6 text-center">
          At <span className="font-semibold">Warea</span>, we believe jewellery
          is more than an accessory — it's a reflection of who you are. Our
          mission is to craft timeless, elegant pieces that complement every
          occasion.
        </p>

        <div className="grid md:grid-cols-2 gap-12 mt-12">
          {/* Story */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="text-gray-600 leading-relaxed">
              Founded with a passion for minimal design, Warea started as a
              small studio dedicated to making jewellery that feels personal,
              modern, and lasting. Today, we continue to focus on quality
              craftsmanship, sustainable sourcing, and customer delight.
            </p>
          </div>

          {/* Mission */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              To inspire confidence and celebrate individuality through
              jewellery that is ethically made, thoughtfully designed, and
              accessible for everyone.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold font-serif text-center mb-8">
        About Warea
      </h1>

      <p className="text-lg text-gray-700 leading-relaxed mb-6 text-center">
        At <span className="font-semibold">Warea</span>, we believe jewellery is
        more than an accessory — it's a reflection of who you are. Our mission is
        to craft timeless, elegant pieces that complement every occasion.
      </p>

      <div className="grid md:grid-cols-2 gap-12 mt-12">
        {/* Story */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
          <p className="text-gray-600 leading-relaxed">
            Founded with a passion for minimal design, Warea started as a small
            studio dedicated to making jewellery that feels personal, modern, and
            lasting. Today, we continue to focus on quality craftsmanship,
            sustainable sourcing, and customer delight.
          </p>
        </div>

        {/* Mission */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed">
            To inspire confidence and celebrate individuality through jewellery
            that is ethically made, thoughtfully designed, and accessible for
            everyone.
          </p>
        </div>
      </div>
    </div>
  );
}


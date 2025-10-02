import Link from "next/link";

const categories = [
  { name: "Earrings",  image: "/categories/earrings.jpg",  link: "/shop?cat=earrings"  },
  { name: "Bracelets", image: "/categories/bracelets.jpg", link: "/shop?cat=bracelets" },
  { name: "Necklaces", image: "/categories/necklaces.jpg", link: "/shop?cat=necklaces" },
  { name: "Gift Sets", image: "/categories/giftsets.jpg",  link: "/shop?cat=giftsets"  },
];

export default function CategorySection() {
  return (
    <section className="container py-12">
      <h2 className="text-3xl font-semibold text-center mb-8">Shop by Collection</h2>

      {/* Responsive grid */}
      <div className="mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 place-items-center max-w-5xl">
        {categories.map((cat) => (
          <Link
            key={cat.name}
            href={cat.link}
            className="group block rounded-xl overflow-hidden border border-transparent
                       bg-white shadow-sm hover:shadow-xl hover:-translate-y-1
                       hover:border-yellow-500 transition-all duration-300
                       w-28 sm:w-32 md:w-40 lg:w-44"
          >
            {/* Image container with fixed aspect ratio */}
            <div className="aspect-square overflow-hidden">
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Text */}
            <div className="py-2 text-center">
              <h3 className="text-sm sm:text-base font-medium transition-colors duration-300 group-hover:text-yellow-600">
                {cat.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

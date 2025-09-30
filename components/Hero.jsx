import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative w-full h-[75vh] md:h-[85vh]">
      {/* Background Image */}
      <img
        src="/hero-banner.jpg"
        alt="Warea Jewellery Banner"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Centered Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-6">
        <h1 className="text-5xl md:text-6xl font-serif font-bold drop-shadow-lg">
          Timeless. Elegant. Warea.
        </h1>
        <p className="text-lg md:text-xl mt-4 max-w-2xl">

        </p>

        <Link
          href="/shop"
          className="mt-8 inline-block bg-white text-gray-900 px-10 py-4 rounded-full text-lg font-bold hover:bg-white-200 transition transform hover:scale-105 shadow-lg"
        >
          SHOP NOW
        </Link>
      </div>
    </section>
  );
}

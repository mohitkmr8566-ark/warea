import Head from "next/head";
import { getBaseUrl } from "@/lib/seoSchemas";

export default function HelpPage() {
  const baseUrl = getBaseUrl();
  const SUPPORT_EMAIL =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "warea.notifications@gmail.com";

  // ✅ FAQ JSON-LD Schema (boosts SEO with rich snippets)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the delivery time for orders?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Orders are usually delivered within 5–7 business days. You will receive a tracking link once shipped.",
        },
      },
      {
        "@type": "Question",
        name: "Do you offer returns or exchanges?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Yes, we accept returns within 7 days of delivery if the product is unused and in original condition.",
        },
      },
      {
        "@type": "Question",
        name: "How can I contact customer support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: `You can email us at ${SUPPORT_EMAIL} or use the contact form on our website.`,
        },
      },
    ],
  };

  return (
    <>
      <Head>
        <title>Help & FAQ | Warea Jewellery</title>
        <meta
          name="description"
          content="Find answers to common questions about orders, shipping, returns, and customer support at Warea Jewellery."
        />
        <link rel="canonical" href={`${baseUrl}/help`} />
        <meta name="robots" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:title" content="Help & FAQs - Warea Jewellery" />
        <meta
          property="og:description"
          content="Frequently asked questions about ordering, shipping, and returns at Warea."
        />
        <meta property="og:url" content={`${baseUrl}/help`} />
        <meta property="og:image" content={`${baseUrl}/logo.png`} />

        {/* Inject JSON-LD Schema for FAQ Rich Results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-serif font-semibold text-center mb-10">
          Help & Frequently Asked Questions
        </h1>

        {/* FAQ 1 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-medium mb-2">📦 Shipping</h2>
          <p className="text-gray-600">
            We ship across India. You’ll be shown delivery charges and estimated
            delivery date during checkout.
          </p>
        </div>

        {/* FAQ 2 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-medium mb-2">🔁 Returns & Exchanges</h2>
          <p className="text-gray-600">
            We offer a 7-day return/exchange policy. Products must be unused and
            in original packaging. Contact us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold underline">
              {SUPPORT_EMAIL}
            </a>{" "}
            to initiate a return.
          </p>
        </div>

        {/* FAQ 3 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium mb-2">📞 Contact Support</h2>
          <p className="text-gray-600">
            Need more help? Email us at{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold underline">
              {SUPPORT_EMAIL}
            </a>{" "}
            or visit our Contact page.
          </p>
        </div>
      </main>
    </>
  );
}

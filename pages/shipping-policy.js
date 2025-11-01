// pages/shipping-policy.js

import Head from "next/head";
import { getBaseUrl } from "@/lib/seoSchemas";

export default function ShippingPolicyPage() {
  const baseUrl = getBaseUrl();

  const shippingSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Shipping & Delivery Policy",
    url: `${baseUrl}/shipping-policy`,
    description:
      "Learn about Warea Jewellery’s shipping process, delivery timelines, courier partners, order tracking, and damaged shipment support.",
  };

  return (
    <>
      <Head>
        <title>Shipping & Delivery Policy | Warea Jewellery</title>
        <meta
          name="description"
          content="Know how Warea Jewellery ships products — delivery time, courier partners, order tracking, packaging safety and damaged delivery process."
        />
        <link rel="canonical" href={`${baseUrl}/shipping-policy`} />
        <meta property="og:title" content="Shipping & Delivery Policy - Warea" />
        <meta
          property="og:description"
          content="Read delivery timelines, courier details and shipping process at Warea Jewellery."
        />
        <meta property="og:image" content={`${baseUrl}/logo.png`} />
        <meta property="og:url" content={`${baseUrl}/shipping-policy`} />
        <meta name="twitter:card" content="summary_large_image" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(shippingSchema) }}
        />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-center mb-10">
          Shipping & Delivery Policy
        </h1>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Shipping Locations</h2>
            <p>
              We currently ship to all major cities & towns across India. International
              shipping will be announced soon.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Delivery Time</h2>
            <ul className="list-disc ml-6">
              <li>📦 **Metro Cities:** 2–5 business days</li>
              <li>📦 **Non-metro / Remote Areas:** 4–7 business days</li>
              <li>📦 **Customized Orders:** Additional 2–3 days for processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Shipping Charges</h2>
            <ul className="list-disc ml-6">
              <li>✅ Free shipping on all prepaid orders.</li>
              <li>🚚 COD orders may include an additional ₹50–₹80 fee.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Order Tracking</h2>
            <p>
              Once shipped, you will receive a tracking ID via email/SMS. You can track your order on our website under **Profile → Orders**.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Damaged or Lost Shipment</h2>
            <p>If your package arrives damaged, please follow:</p>
            <ul className="list-disc ml-6">
              <li>Record a video while unboxing the parcel.</li>
              <li>Mail us at <strong>warea.notifications@gmail.com</strong> within 24 hours.</li>
              <li>We only offer **replacement**, not refund.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Contact Support</h2>
            <p>
              📩 Email: <strong>warea.notifications@gmail.com</strong>
              <br />
              📞 Phone: <strong>+91 98765 43210</strong>
            </p>
          </section>
        </div>
      </main>
    </>
  );
}

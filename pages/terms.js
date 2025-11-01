// pages/terms.js

import Head from "next/head";
import { getBaseUrl } from "@/lib/seoSchemas";

export default function TermsPage() {
  const baseUrl = getBaseUrl();

  const termsSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Terms & Conditions",
    url: `${baseUrl}/terms`,
    description:
      "Read the terms and conditions for using Warea Jewellery’s website, services, product purchase, and policies.",
  };

  return (
    <>
      <Head>
        <title>Terms & Conditions | Warea Jewellery</title>
        <meta
          name="description"
          content="These Terms & Conditions govern the use of Warea Jewellery's website, products, and services. Please read them carefully."
        />
        <link rel="canonical" href={`${baseUrl}/terms`} />
        <meta property="og:title" content="Terms & Conditions - Warea Jewellery" />
        <meta
          property="og:description"
          content="Legal terms of using Warea Jewellery's services and purchasing products."
        />
        <meta property="og:url" content={`${baseUrl}/terms`} />
        <meta property="og:image" content={`${baseUrl}/logo.png`} />
        <meta name="twitter:card" content="summary_large_image" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(termsSchema) }}
        />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-center mb-10">
          Terms & Conditions
        </h1>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. General</h2>
            <p>
              By accessing or purchasing from <strong>Warea Jewellery</strong>, you agree to comply
              with these Terms & Conditions. If you do not agree, please do not use this website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Product & Pricing</h2>
            <p>
              All prices, product descriptions, and availability are subject to change without notice.
              We try to ensure accuracy, however errors may occur. In case of incorrect pricing,
              we reserve the right to cancel or modify the order before shipment.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Orders & Payments</h2>
            <ul className="list-disc ml-6">
              <li>Orders are confirmed only after successful payment or COD approval.</li>
              <li>We use secure payment gateways like Razorpay.</li>
              <li>In case of payment failure but money is deducted, it will be refunded by the payment provider within 5–7 working days.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Replacement Policy (No Returns)</h2>
            <p>
              Warea Jewellery does <strong>not offer returns or refunds</strong>.
              However, we provide a **7-day replacement** in case of:
            </p>
            <ul className="list-disc ml-6">
              <li>Damaged product received</li>
              <li>Wrong product delivered</li>
            </ul>
            <p>
              To request a replacement, email us within 24 hours of delivery with unboxing video proof at
              <strong> warea.notifications@gmail.com</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Intellectual Property</h2>
            <p>
              All designs, logos, images, and website content are the property of Warea Creations
              and protected under applicable copyright and trademark laws. You may not use or copy without permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Limitation of Liability</h2>
            <p>
              Warea Jewellery is not liable for any indirect, incidental, or consequential damages
              arising from use of our website, products, or services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Governing Law</h2>
            <p>
              These Terms are governed by the laws of <strong>India</strong>. Any disputes shall be subject
              to the jurisdiction of courts in <strong>Kanpur, Uttar Pradesh</strong>.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}

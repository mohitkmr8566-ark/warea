// pages/replacement-policy.js

import Head from "next/head";
import { getBaseUrl } from "@/lib/seoSchemas";

export default function ReplacementPolicyPage() {
  const baseUrl = getBaseUrl();

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Replacement Policy",
    url: `${baseUrl}/replacement-policy`,
    description:
      "Warea Jewellery offers replacement for damaged or incorrect products. No returns or refunds. Read the full replacement policy.",
  };

  return (
    <>
      <Head>
        <title>Replacement Policy | Warea Jewellery</title>
        <meta
          name="description"
          content="Warea offers product replacement only in case of damaged or wrong items received. No returns or refunds. Read full policy here."
        />
        <link rel="canonical" href={`${baseUrl}/replacement-policy`} />
        <meta property="og:title" content="Replacement Policy - Warea" />
        <meta
          property="og:description"
          content="No returns, only product replacement in case of damage or wrong item. Contact Warea support within 24 hours of delivery."
        />
        <meta property="og:image" content={`${baseUrl}/logo.png`} />
        <meta property="og:url" content={`${baseUrl}/replacement-policy`} />
        <meta name="twitter:card" content="summary_large_image" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      </Head>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-center mb-10">
          Replacement Policy
        </h1>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>
            At <strong>Warea Jewellery</strong>, we ensure each product is thoroughly inspected before
            dispatch. However, if you receive a <strong>damaged, defective, or incorrect product</strong>,
            you are eligible for a replacement.
          </p>

          <section>
            <h2 className="text-xl font-semibold mb-2">✅ Eligibility for Replacement</h2>
            <ul className="list-disc ml-6">
              <li>Product received is damaged or broken.</li>
              <li>Wrong product or design delivered.</li>
              <li>Manufacturing defect visible upon opening.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">⛔ No Return / Refund Policy</h2>
            <p>
              We do <strong>not accept returns or provide refunds</strong>. Only replacement is provided
              in case of valid issues.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">📦 Mandatory Unboxing Video</h2>
            <p>
              To claim a replacement, you must provide a <strong>clear unboxing video</strong> showing:
            </p>
            <ul className="list-disc ml-6">
              <li>Package from all sides before opening.</li>
              <li>Opening the seal clearly in the video.</li>
              <li>Showing product damage or wrong item.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">🕒 Time Limit to Raise Request</h2>
            <p>
              You must raise a replacement request within <strong>24 hours of delivery</strong>.
              Requests after 24 hours will not be accepted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">📩 How to Request Replacement</h2>
            <ul className="list-disc ml-6">
              <li>Email us at <strong>warea.notifications@gmail.com</strong></li>
              <li>Subject: <em>Replacement Request - Order #12345</em></li>
              <li>Attach unboxing video + order ID + issue details</li>
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}

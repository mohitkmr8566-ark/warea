"use client";

import Head from "next/head";
import { useState } from "react";
import { getBaseUrl } from "@/lib/seoSchemas";

export default function ContactPage() {
  const baseUrl = getBaseUrl();
  const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "warea.notifications@gmail.com";

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name || !form.email || !form.message) {
      setError("All fields are required.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Future: Replace with actual API call (SendGrid / Firebase / Email API)
    console.log("Form submitted:", form);
    setSuccess("✅ Thank you! Your message has been sent.");
    setForm({ name: "", email: "", message: "" });
  }

  // ✅ JSON-LD Schema (ContactPage + Organization)
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Warea Creations",
    url: `${baseUrl}/contact`,
    mainEntity: {
      "@type": "Organization",
      name: "Warea Creations",
      url: baseUrl,
      contactPoint: {
        "@type": "ContactPoint",
        email: SUPPORT_EMAIL,
        telephone: "+91-98765-43210",
        contactType: "customer support",
        areaServed: "IN",
        availableLanguage: ["en", "hi"],
      },
    },
  };

  return (
    <>
      <Head>
        <title>Contact Warea Creations | Customer Support & Enquiries</title>
        <meta
          name="description"
          content="Get in touch with Warea Creations for support, product enquiries, collaboration, or business-related questions."
        />
        <link rel="canonical" href={`${baseUrl}/contact`} />
        <meta name="robots" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Contact Warea Creations" />
        <meta
          property="og:description"
          content="Need help? Reach out to Warea's customer support team via email or contact form."
        />
        <meta property="og:url" content={`${baseUrl}/contact`} />
        <meta property="og:image" content={`${baseUrl}/logo.png`} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Warea Creations" />
        <meta
          name="twitter:description"
          content="Get in touch with Warea Creations support team."
        />

        {/* ✅ Inject Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(contactSchema),
          }}
        />
      </Head>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold font-serif text-center mb-6">
          Contact Us
        </h1>

        <p className="text-gray-600 text-center mb-10">
          We'd love to hear from you! Fill out the form below or email us at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold underline">
            {SUPPORT_EMAIL}
          </a>
        </p>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white shadow-md rounded-lg p-6"
        >
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your Name"
              className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              name="message"
              rows={4}
              value={form.message}
              onChange={handleChange}
              placeholder="Write your message here..."
              className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gray-400"
            ></textarea>
          </div>

          <button
            type="submit"
            className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition"
          >
            Send Message
          </button>
        </form>

        <div className="mt-10 text-center text-gray-600">
          Or call us at <span className="font-semibold">+91 98765 43210</span>
        </div>
      </div>
    </>
  );
}

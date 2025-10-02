"use client";

import { useState } from "react";

export default function ContactPage() {
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

    // simple email regex check
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Simulate form submission
    console.log("Form submitted:", form);
    setSuccess("✅ Thank you! Your message has been sent.");
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold font-serif text-center mb-6">
        Contact Us
      </h1>
      <p className="text-gray-600 text-center mb-10">
        We'd love to hear from you! Fill out the form below or reach us at{" "}
        <span className="font-semibold">support@warea.com</span>
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
  );
}

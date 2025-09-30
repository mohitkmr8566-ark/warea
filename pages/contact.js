export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold font-serif text-center mb-8">
        Contact Us
      </h1>
      <p className="text-gray-600 text-center mb-12">
        We'd love to hear from you! Fill out the form below or reach us at{" "}
        <span className="font-semibold">support@warea.com</span>
      </p>

      <form className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            placeholder="Your Name"
            className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full border border-gray-300 rounded-md px-4 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Message
          </label>
          <textarea
            rows={4}
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

      <div className="mt-12 text-center text-gray-600">
        Or call us at <span className="font-semibold">+91 98765 43210</span>
      </div>
    </div>
  );
}


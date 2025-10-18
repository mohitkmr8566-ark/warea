import { useRouter } from "next/router";

export default function OrderSuccessPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <div className="max-w-xl mx-auto px-6 py-16 text-center">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          🎉 Order Confirmed!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase. Your jewellery will be on its way soon.
        </p>

        <div className="bg-gray-50 border rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">
            Order ID: <span className="font-semibold">#{id?.slice(0, 8)}</span>
          </p>
          <p className="text-sm text-gray-600">Estimated Delivery: 5–7 business days</p>
        </div>

        <a
          href="/shop"
          className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-700 transition"
        >
          Continue Shopping
        </a>
      </div>
    </div>
  );
}

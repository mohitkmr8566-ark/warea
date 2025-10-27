// pages/api/verify-razorpay.js
import crypto from "crypto";
import { adminDb } from "../../lib/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderPayload, // { items, total, address, user }
    } = req.body || {};

    // 🛡️ 1. Validate fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing Razorpay fields" });
    }

    // 🔐 2. Verify signature with SECRET key
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // 📦 3. Normalize and prepare order data
    const { items = [], total = 0, address = null, user = {} } = orderPayload || {};
    const userEmail = user?.email || null;

    const orderDoc = {
      userId: userEmail,
      customer: address,
      items,
      total,
      status: "Paid",
      payment: {
        type: "RAZORPAY",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      },
      gateway: "razorpay",
      statusTimestamps: {
        Paid: adminDb.FieldValue.serverTimestamp(),
      },
      createdAt: adminDb.FieldValue.serverTimestamp(),
    };

    // 📝 4. Save order to Firestore (Admin SDK)
    const docRef = await adminDb.collection("orders").add(orderDoc);

    // 🟢 5. Return success + orderId (for redirect on frontend)
    return res.status(200).json({ ok: true, orderId: docRef.id });
  } catch (err) {
    console.error("Verify/save error:", err);
    return res.status(500).json({ error: "Server error verifying payment" });
  }
}

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

    // Basic checks
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing Razorpay fields" });
    }

    // Verify HMAC signature using SECRET (server-only)
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Normalize payload → match your project’s order schema
    const { items = [], total = 0, address = null, user = {} } = orderPayload || {};
    const userEmail = user?.email || null;

    const orderDoc = {
      userId: userEmail,
      customer: address,                 // ← your COD flow uses "customer", so keep same key
      items,
      total,
      status: "Paid",
      payment: {
        type: "RAZORPAY",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      },
      gateway: "razorpay",
      createdAt: adminDb.FieldValue ? adminDb.FieldValue.serverTimestamp() : new Date(), // fallback
    };

    // Write with Admin SDK (bypasses Firestore rules)
    await adminDb.collection("orders").add(orderDoc);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Verify/save error:", err);
    return res.status(500).json({ error: "Server error verifying payment" });
  }
}

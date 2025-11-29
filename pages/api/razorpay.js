// pages/api/razorpay.js
import Razorpay from "razorpay";
import { admin, adminDb } from "../../lib/firebaseAdmin"; // adjust if your exports differ
import { v4 as uuidv4 } from "uuid";

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_BASE_URL || "*";

export default async function handler(req, res) {
  // CORS preflight support
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  // always set CORS header for normal responses too (same-origin safe)
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { amount, receiptNote, items = [], user = {} } = req.body || {};
    const amountNum = Number(amount);

    if (!amountNum || amountNum <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Use server-only envs (do not rely on NEXT_PUBLIC for secret)
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(500).json({ error: "Razorpay keys missing on server" });
    }

    // 1) create Firestore order doc (pending)
    const orderRef = adminDb.collection("orders").doc();
    const clientOrderId = orderRef.id;

    const createdAt = admin.firestore.FieldValue.serverTimestamp();
    const initialDoc = {
      userId: user?.email || null,
      customer: user?.address || null,
      items,
      total: amountNum,
      status: "pending",
      gateway: "razorpay",
      createdAt,
      updatedAt: createdAt,
      meta: {
        receiptNote: receiptNote || null,
      },
    };

    await orderRef.set(initialDoc);

    // 2) create razorpay order with notes containing clientOrderId
    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: Math.round(amountNum * 100), // paise
      currency: process.env.NEXT_PUBLIC_CURRENCY || "INR",
      receipt: `warea_${uuidv4()}`,
      payment_capture: 1,
      notes: {
        orderId: clientOrderId,
        source: "Warea Checkout",
        ...(receiptNote ? { receiptNote } : {}),
      },
    };

    const rOrder = await razorpay.orders.create(options);

    // 3) persist razorpay order id into Firestore order doc for fallback
    await orderRef.update({
      "payment.order_id": rOrder.id,
      "payment.receipt": options.receipt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({
      success: true,
      razorpayOrder: rOrder,
      clientOrderId,
    });
  } catch (err) {
    console.error("Create Razorpay order error:", err);
    return res.status(500).json({ error: "Failed to create Razorpay order" });
  }
}

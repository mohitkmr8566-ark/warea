// pages/api/razorpay.js
import Razorpay from "razorpay";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { amount, receiptNote } = req.body || {};
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      return res.status(500).json({ error: "Razorpay keys missing on server" });
    }

    const razorpay = new Razorpay({ key_id, key_secret });

    const order = await razorpay.orders.create({
      amount: Math.round(amountNum * 100), // in paise
      currency: process.env.NEXT_PUBLIC_CURRENCY || "INR",
      receipt: `warea_${Date.now()}`,
      notes: { source: "Warea Checkout", ...(receiptNote ? { receiptNote } : {}) },
    });

    // Return both patterns so current/future clients are happy
    return res.status(200).json({
      order,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      notes: order.notes,
    });
  } catch (err) {
    console.error("Create Razorpay order error:", err);
    return res.status(500).json({ error: "Failed to create Razorpay order" });
  }
}

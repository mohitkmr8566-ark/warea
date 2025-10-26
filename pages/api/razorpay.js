// pages/api/razorpay.js
import Razorpay from "razorpay";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { amount, receiptNote } = req.body || {};
    if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // paise
      currency: process.env.NEXT_PUBLIC_CURRENCY || "INR",
      receipt: `warea_${Date.now()}`,
      notes: { source: "Warea Checkout", ...(receiptNote ? { receiptNote } : {}) },
    });

    return res.status(200).json({ order });
  } catch (err) {
    console.error("Create Razorpay order error:", err);
    return res.status(500).json({ error: "Failed to create Razorpay order" });
  }
}

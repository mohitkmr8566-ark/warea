import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../lib/firebaseAdmin";
import { generateInvoiceBuffer } from "../../../lib/invoice";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderId } = req.query;

  if (req.method !== "GET") return res.status(405).json({ error: "Method Not Allowed" });
  if (!orderId || typeof orderId !== "string") return res.status(400).json({ error: "Invalid order ID" });

  try {
    const snap = await adminDb.collection("orders").doc(orderId).get();
    if (!snap.exists) return res.status(404).json({ error: "Order not found" });

    const order = snap.data();
    const buffer = await generateInvoiceBuffer(order, orderId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=invoice-${orderId}.pdf`);
    res.send(buffer);
  } catch (err) {
    console.error("Invoice error:", err);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
}

import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../lib/firebaseAdmin";
import { generateInvoiceBuffer } from "../../../lib/invoice";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderId } = req.query;

  if (req.method !== "GET")
    return res.status(405).json({ error: "Method Not Allowed" });

  if (!orderId || typeof orderId !== "string")
    return res.status(400).json({ error: "Invalid order ID" });

  const orderIdStr = orderId as string;

  try {
    const snap = await adminDb.collection("orders").doc(orderIdStr).get();
    if (!snap.exists) return res.status(404).json({ error: "Order not found" });

    const order = snap.data();

    // ✅ Fix TS complaining here due to .js file
    // @ts-ignore
    const buffer = await generateInvoiceBuffer(order, orderIdStr);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=invoice-${orderIdStr}.pdf`
    );

    res.send(buffer);
  } catch (err) {
    console.error("Invoice error:", err);
    res.status(500).json({ error: "Failed to generate invoice" });
  }
}

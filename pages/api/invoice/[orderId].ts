// pages/api/invoice/[orderId].ts
import type { NextApiRequest, NextApiResponse } from "next";
import { adminDb } from "../../../lib/firebaseAdmin";
import { generateInvoiceBuffer } from "../../../lib/invoice";

function safeFilename(s: string) {
  return s.replace(/[^a-zA-Z0-9-_\.]/g, "-");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { orderId } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!orderId || typeof orderId !== "string") {
    return res.status(400).json({ error: "Invalid order ID" });
  }

  const orderIdStr = orderId as string;

  try {
    const snap = await adminDb.collection("orders").doc(orderIdStr).get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    // --- TS fix: assert order exists and give it a safe type so generateInvoiceBuffer accepts it ---
    const order = snap.data() as Record<string, any>; // <-- important: this removes the TS "possibly undefined" error

    // generateInvoiceBuffer should return a Buffer, Uint8Array or ArrayBuffer
    const buffer = await generateInvoiceBuffer(order, orderIdStr);

    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

    // Security + caching headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${safeFilename(`invoice-${orderIdStr}.pdf`)}"`
    );
    res.setHeader("Content-Length", String(buf.length));
    // private so browsers / proxies don't cache user-specific invoices
    res.setHeader("Cache-Control", "private, max-age=0, must-revalidate");

    return res.status(200).send(buf);
  } catch (err: any) {
    console.error("🔥 Invoice generation failed:", err?.message || err, err?.stack || "");
    return res.status(500).json({ error: "Failed to generate invoice" });
  }
}

import type { NextApiRequest, NextApiResponse } from "next";
// 1. Import Firestore type for usage
import { Firestore } from "firebase-admin/firestore";
import { generateInvoiceBuffer } from "../../../lib/invoice";

// 2. FIX: Import the entire module as a generic object
import * as firebaseAdminModule from "../../../lib/firebaseAdmin";

// 3. Force-cast the module to 'any' to bypass strict checks,
//    then extract adminDb and tell TS it is a 'Firestore' instance.
const adminDb = (firebaseAdminModule as any).adminDb as Firestore;

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

  try {
    const snap = await adminDb.collection("orders").doc(orderId).get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = snap.data() as Record<string, any>;

    const buffer = await generateInvoiceBuffer(order, orderId);
    const pdf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${safeFilename(`invoice-${orderId}.pdf`)}"`
    );
    res.setHeader("Content-Length", String(pdf.length));
    res.setHeader("Cache-Control", "private, max-age=0, must-revalidate");

    return res.status(200).send(pdf);
  } catch (err: any) {
    console.error("🔥 Invoice generation failed:", err);
    return res.status(500).json({ error: "Failed to generate invoice" });
  }
}

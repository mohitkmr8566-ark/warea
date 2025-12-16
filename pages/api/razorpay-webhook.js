// pages/api/razorpay-webhook.js

import { admin, adminDb } from "../../lib/firebaseAdmin";
import crypto from "crypto";

export const config = {
  api: { bodyParser: false }, // REQUIRED for Razorpay signature verification
};

// Read raw body
async function buffer(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const rawBody = await buffer(req);

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("❌ RAZORPAY_WEBHOOK_SECRET missing");
    return res.status(500).json({ error: "Webhook secret not configured" });
  }

  // Verify signature
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const receivedSignature = req.headers["x-razorpay-signature"];

  if (!receivedSignature || expectedSignature !== receivedSignature) {
    console.warn("❌ Razorpay webhook signature mismatch");
    return res.status(400).json({ error: "Invalid signature" });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString());
  } catch (err) {
    console.error("❌ Invalid webhook JSON payload", err);
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
    const event = payload.event;

    /**
     * ✅ PAYMENT CAPTURED (FINAL SUCCESS)
     */
    if (event === "payment.captured") {
      const payment = payload.payload?.payment?.entity;
      if (!payment) return res.status(200).json({ ok: true });

      const clientOrderId =
        payment?.notes?.orderId || payment?.notes?.clientOrderId;

      const updateData = {
        status: "Paid", // ✅ canonical status
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        statusTimestamps: {
          Paid: admin.firestore.FieldValue.serverTimestamp(),
        },
        payment: {
          source: "razorpay_webhook",
          paymentId: payment.id,
          orderId: payment.order_id,
          method: payment.method,
          captured: payment.captured,
          raw: payment, // keep full payload for audits
        },
      };

      if (clientOrderId) {
        await adminDb
          .collection("orders")
          .doc(clientOrderId)
          .set(updateData, { merge: true });
      } else {
        // Fallback match by razorpay order id
        const q = await adminDb
          .collection("orders")
          .where("payment.order_id", "==", payment.order_id)
          .limit(1)
          .get();

        if (!q.empty) {
          await q.docs[0].ref.set(updateData, { merge: true });
        } else {
          console.warn(
            "⚠️ Webhook payment captured but order not found:",
            payment.order_id
          );
        }
      }
    }

    /**
     * ❌ PAYMENT FAILED
     */
    else if (event === "payment.failed") {
      const payment = payload.payload?.payment?.entity;
      if (!payment) return res.status(200).json({ ok: true });

      const q = await adminDb
        .collection("orders")
        .where("payment.order_id", "==", payment.order_id)
        .limit(1)
        .get();

      if (!q.empty) {
        await q.docs[0].ref.set(
          {
            status: "Payment_Failed",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            payment: {
              source: "razorpay_webhook",
              failed: true,
              raw: payment,
            },
          },
          { merge: true }
        );
      }
    }

    // Ignore other events safely (order.paid, refund.created, etc.)
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("🔥 Razorpay webhook handler error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}

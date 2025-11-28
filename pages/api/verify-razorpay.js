// pages/api/verify-razorpay.js
import crypto from "crypto";
import nodemailer from "nodemailer";
import { admin, adminDb } from "../../lib/firebaseAdmin";
import { generateInvoiceBuffer } from "../../lib/invoice";
import { zoneFromPincode, etaRange } from "@/lib/logistics";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderPayload,
      clientOrderId, // <- optional: clientOrderId we returned earlier from /api/razorpay
    } = req.body || {};

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing Razorpay fields" });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ error: "Razorpay secret missing on server" });
    }

    // Verify HMAC signature
    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Extract payload (items, total, address, user)
    const { items = [], total = 0, address = null, user = {} } = orderPayload || {};
    const userEmail = user?.email || null;

    // Logistics ETA (optional)
    let logistics = null;
    if (address?.pincode) {
      const zone = zoneFromPincode(address.pincode);
      const eta = etaRange(zone);
      logistics = { zone, eta: { start: eta.start, end: eta.end } };
    }

    const nowTS = admin.firestore.FieldValue.serverTimestamp();

    // Build payment object
    const paymentObj = {
      type: "RAZORPAY",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      signature: razorpay_signature,
    };

    // If clientOrderId present -> update existing order doc
    if (clientOrderId) {
      const docRef = adminDb.collection("orders").doc(clientOrderId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        await docRef.update({
          status: "Paid",
          payment: paymentObj,
          statusTimestamps: { Paid: nowTS },
          logistics,
          updatedAt: nowTS,
        });
      } else {
        // fallback: create doc if somehow missing
        await docRef.set({
          userId: userEmail,
          customer: address,
          items,
          total,
          status: "Paid",
          payment: paymentObj,
          gateway: "razorpay",
          statusTimestamps: { Paid: nowTS },
          logistics,
          createdAt: nowTS,
          updatedAt: nowTS,
        });
      }
      // send invoice/email below (if configured)
      const orderId = clientOrderId;

      // optional: invoice email
      await maybeSendInvoiceEmail(orderId, {
        orderDoc: { userId: userEmail, customer: address, items, total },
        smtpReady: getSmtpReady(),
      });

      return res.status(200).json({ success: true, orderId });
    }

    // If no clientOrderId, attempt to match by razorpay_order_id inside existing docs
    const q = await adminDb
      .collection("orders")
      .where("payment.order_id", "==", razorpay_order_id)
      .limit(1)
      .get();

    if (!q.empty) {
      const docRef = q.docs[0].ref;
      await docRef.update({
        status: "Paid",
        payment: paymentObj,
        statusTimestamps: { Paid: nowTS },
        logistics,
        updatedAt: nowTS,
      });

      const orderId = docRef.id;
      await maybeSendInvoiceEmail(orderId, {
        orderDoc: q.docs[0].data(),
        smtpReady: getSmtpReady(),
      });

      return res.status(200).json({ success: true, orderId });
    }

    // If still not found, create a new order to avoid losing record
    const newDocRef = await adminDb.collection("orders").add({
      userId: userEmail,
      customer: address,
      items,
      total,
      status: "Paid",
      payment: paymentObj,
      gateway: "razorpay",
      statusTimestamps: { Paid: nowTS },
      logistics,
      createdAt: nowTS,
      updatedAt: nowTS,
    });

    const newOrderId = newDocRef.id;
    await maybeSendInvoiceEmail(newOrderId, {
      orderDoc: { userId: userEmail, customer: address, items, total },
      smtpReady: getSmtpReady(),
    });

    return res.status(200).json({ success: true, orderId: newOrderId });
  } catch (err) {
    console.error("Verify/save error:", err);
    return res.status(500).json({ error: "Server error verifying payment" });
  }
}

/**
 * Helpers: extract SMTP readiness and optionally send invoice email.
 * Keep behavior identical to previous file — we try to send invoice if SMTP configured.
 */
function getSmtpReady() {
  return (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.FROM_EMAIL
  );
}

async function maybeSendInvoiceEmail(orderId, { orderDoc, smtpReady }) {
  if (!smtpReady || !orderDoc?.userId) return;

  try {
    const buffer = await generateInvoiceBuffer(orderDoc, orderId);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: orderDoc.userId,
      subject: `Your Warea Invoice · Order #${orderId}`,
      text: `Thank you for your purchase!\n\nWe've attached your invoice for Order #${orderId}.\n\n— Warea`,
      html: `<p>Thank you for your purchase!</p>
             <p>Your invoice for <strong>Order #${orderId}</strong> is attached.</p>
             <p>— Warea</p>`,
      attachments: [
        {
          filename: `invoice-${orderId}.pdf`,
          content: buffer,
          contentType: "application/pdf",
        },
      ],
    });
  } catch (e) {
    console.warn("Invoice email failed:", e);
    // Do not block the main flow
  }
}

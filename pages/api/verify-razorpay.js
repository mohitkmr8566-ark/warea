import crypto from "crypto";
import { adminDb } from "../../lib/firebaseAdmin";
import nodemailer from "nodemailer";
import { generateInvoiceBuffer } from "../../lib/invoice";
import { zoneFromPincode, etaRange } from "@/lib/logistics";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderPayload,
    } = req.body || {};

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing Razorpay fields" });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const { items = [], total = 0, address = null, user = {} } = orderPayload || {};
    const userEmail = user?.email || null;

    let logistics = null;
    if (address?.pincode) {
      const zone = zoneFromPincode(address.pincode);
      const eta = etaRange(zone);
      logistics = { zone, eta: { start: eta.start, end: eta.end } };
    }

    const orderDoc = {
      userId: userEmail,
      customer: address,
      items,
      total,
      status: "Paid",
      payment: {
        type: "RAZORPAY",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      },
      gateway: "razorpay",
      statusTimestamps: { Paid: adminDb.FieldValue.serverTimestamp() },
      logistics,
      createdAt: adminDb.FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection("orders").add(orderDoc);
    const orderId = docRef.id;

    // 📨 Email invoice if SMTP configured
    const smtpReady =
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.FROM_EMAIL;

    if (smtpReady && userEmail) {
      try {
        const buffer = await generateInvoiceBuffer(orderDoc, orderId);

        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to: userEmail,
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
      }
    }

    return res.status(200).json({ ok: true, orderId });
  } catch (err) {
    console.error("Verify/save error:", err);
    return res.status(500).json({ error: "Server error verifying payment" });
  }
}

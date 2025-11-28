// pages/api/razorpay-webhook.js
import admin from '../../lib/firebaseAdmin'; // adjust path if needed
import crypto from 'crypto';

export const config = {
  api: { bodyParser: false },
};

async function buffer(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const rawBody = await buffer(req);
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(500).end('Webhook secret not configured');

  const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const receivedSignature = req.headers['x-razorpay-signature'];

  if (!receivedSignature || expectedSignature !== receivedSignature) {
    console.warn('Razorpay webhook signature mismatch');
    return res.status(400).end('invalid signature');
  }

  let payload;
  try { payload = JSON.parse(rawBody.toString()); }
  catch (err) { console.error('Invalid webhook payload', err); return res.status(400).end('invalid payload'); }

  try {
    const event = payload.event;
    if (event === 'payment.captured' || event === 'payment.authorized') {
      const payment = payload.payload?.payment?.entity;
      if (payment) {
        const clientOrderId = payment?.notes?.orderId || payment?.notes?.clientOrderId;
        if (clientOrderId) {
          await admin.firestore().collection('orders').doc(clientOrderId).update({
            status: 'paid',
            payment,
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } else {
          // fallback: match by razorpay order id
          const razorpayOrderId = payment.order_id;
          const q = await admin.firestore().collection('orders')
            .where('payment.order_id', '==', razorpayOrderId).limit(1).get();
          if (!q.empty) {
            await q.docs[0].ref.update({
              status: 'paid',
              payment,
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          } else {
            console.warn('Order not found for payment captured webhook', razorpayOrderId);
          }
        }
      }
    } else if (event === 'payment.failed') {
      const payment = payload.payload?.payment?.entity;
      const razorpayOrderId = payment?.order_id;
      if (razorpayOrderId) {
        const q = await admin.firestore().collection('orders')
          .where('payment.order_id', '==', razorpayOrderId).limit(1).get();
        if (!q.empty) {
          await q.docs[0].ref.update({ status: 'payment_failed', payment });
        }
      }
    } else if (event === 'order.paid') {
      // handle if needed
    }
    // respond OK
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Webhook handler error', err);
    return res.status(500).end('server error');
  }
}

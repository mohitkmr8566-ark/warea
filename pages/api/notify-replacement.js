// pages/api/notify-replacement.js
import sg from "@sendgrid/mail";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { orderId, replacementId, reason, note, userEmail } = req.body || {};
    if (!orderId || !replacementId || !reason) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDER_EMAIL || "no-reply@warea.app";
    const adminList =
      (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

    if (!apiKey || !adminList.length) {
      return res.status(200).json({ ok: true, skipped: "Email not configured" });
    }

    sg.setApiKey(apiKey);

    const subject = `Replacement Requested · Order #${String(orderId).slice(0, 8)}`;
    const text = [
      `A customer has requested a replacement.`,
      ``,
      `Order ID: ${orderId}`,
      `Replacement ID: ${replacementId}`,
      `User: ${userEmail || "unknown"}`,
      `Reason: ${reason}`,
      `Note: ${note || "-"}`,
      ``,
      `Admin links:`,
      `- Dashboard: /admin/replacements`,
      `- Order: /order/${orderId}`,
    ].join("\n");

    const html = `
      <p>A customer has requested a replacement.</p>
      <ul>
        <li><strong>Order ID:</strong> ${orderId}</li>
        <li><strong>Replacement ID:</strong> ${replacementId}</li>
        <li><strong>User:</strong> ${userEmail || "unknown"}</li>
        <li><strong>Reason:</strong> ${reason}</li>
        <li><strong>Note:</strong> ${note || "-"}</li>
      </ul>
      <p><strong>Admin links:</strong></p>
      <ul>
        <li><a href="/admin/replacements">Dashboard</a></li>
        <li><a href="/order/${orderId}">View Order</a></li>
      </ul>
    `;

    const msg = {
      to: adminList,
      from: fromEmail,
      subject,
      text,
      html,
    };

    await sg.sendMultiple(msg);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("notify-replacement error:", e);
    return res.status(500).json({ error: "Failed to send email" });
  }
}

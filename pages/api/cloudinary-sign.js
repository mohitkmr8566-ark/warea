// pages/api/cloudinary-sign.js
import crypto from "crypto";
import { getAuth } from "firebase-admin/auth";
import initAdmin from "@/lib/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    await initAdmin();

    const authHeader = req.headers.authorization || "";
    const idToken = authHeader.replace("Bearer ", "").trim();
    if (!idToken) return res.status(401).json({ error: "Missing token" });

    const decoded = await getAuth().verifyIdToken(idToken);
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",") || [];
    if (!adminEmails.includes(decoded.email)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = "warea/products"; // optional - can modify if needed
    const stringToSign = `folder=${folder}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

    return res.json({
      signature,
      timestamp,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    });
  } catch (err) {
    console.error("sign error:", err);
    return res.status(500).json({ error: "Failed to sign upload request" });
  }
}

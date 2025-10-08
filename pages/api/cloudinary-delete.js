// pages/api/cloudinary-delete.js
import cloudinary from "cloudinary";

// 🔐 Initialize Cloudinary SDK (server-side only)
cloudinary.v2.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { public_id } = req.body;

    if (!public_id) {
      return res.status(400).json({ error: "Missing public_id" });
    }

    // ✅ Perform deletion
    const result = await cloudinary.v2.uploader.destroy(public_id);

    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(result.result || "Failed to delete");
    }

    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("Cloudinary Delete API Error:", error);
    return res.status(500).json({
      error: "Failed to delete image from Cloudinary",
      details: error.message,
    });
  }
}

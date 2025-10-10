// lib/cloudinary.js
/**
 * Secure Cloudinary upload utility
 * Uses signed uploads via our /api/cloudinary-sign endpoint
 * (protects against anonymous uploads)
 */

export async function uploadToCloudinary(file, userToken) {
  if (!file) throw new Error("No file provided");
  if (!userToken) throw new Error("Missing user token for signed upload");

  // 1️⃣ Request a signed upload token from our API
  const signRes = await fetch("/api/cloudinary-sign", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  });

  if (!signRes.ok) {
    const msg = await signRes.text();
    throw new Error("Failed to get Cloudinary signature: " + msg);
  }

  const { signature, timestamp, apiKey, cloudName, error } = await signRes.json();
  if (error) throw new Error("Signature error: " + error);

  // 2️⃣ Prepare upload payload for Cloudinary
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);

  // Optional: organize uploads by folder (from your .env server vars)
  // Example: formData.append("folder", "warea/products");

  // 3️⃣ Upload securely to Cloudinary
  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error("Cloudinary upload failed: " + errText);
  }

  // 4️⃣ Return full Cloudinary response (includes secure_url, public_id, etc.)
  return await uploadRes.json();
}

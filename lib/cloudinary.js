// lib/cloudinary.js
// Client-side unsigned upload helper (uses the unsigned upload preset you created)
// Returns Cloudinary response JSON { secure_url, public_id, ... }
export async function uploadToCloudinary(file) {
  if (!file) throw new Error("No file provided");

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = "unsigned_warea"; // your preset name

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("Cloudinary upload failed: " + text);
  }

  return res.json();
}

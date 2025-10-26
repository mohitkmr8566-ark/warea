import { useState } from "react";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/firebase";
import { addDoc, updateDoc, collection, doc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

export default function ProductForm({ product, onSaved, onCancel }) {
  const isEdit = !!product;

  const [form, setForm] = useState({
    title: product?.title || "",
    price: product?.price || "",
    category: product?.category || "",
    description: product?.description || "",
  });

  const [images, setImages] = useState(product?.images || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    const toastId = toast.loading("Uploading images...");
    try {
      const uploaded = [];
      for (const file of files) {
        const res = await uploadToCloudinary(file);
        uploaded.push({ url: res.secure_url, public_id: res.public_id });
      }
      setImages((prev) => [...prev, ...uploaded].slice(0, 5));
      toast.success(`${uploaded.length} image(s) uploaded ✅`);
    } catch (err) {
      toast.error("Image upload failed");
      console.error(err);
    } finally {
      toast.dismiss(toastId);
      setUploading(false);
    }
  };

  const handleDeleteImage = (idx) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) {
      toast.error("Title and price are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        image: images[0]?.url || null, // 👈 primary image for faster rendering
        images,
        updatedAt: serverTimestamp(),
      };

      if (isEdit) {
        await updateDoc(doc(db, "products", product.id), payload);
        toast.success("Product updated ✅");
      } else {
        await addDoc(collection(db, "products"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success("Product created ✅");
      }

      onSaved?.();
    } catch (err) {
      toast.error("Failed to save product ❌");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-lg shadow p-5 space-y-4">
      <h3 className="font-semibold text-lg mb-2">
        {isEdit ? "Edit Product" : "Add Product"}
      </h3>

      <div>
        <label className="block text-sm mb-1">Title</label>
        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-gray-200"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Price (₹)</label>
        <input
          type="number"
          name="price"
          min="0"
          value={form.price}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-gray-200"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Category</label>
        <input
          name="category"
          value={form.category}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-gray-200"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Description</label>
        <textarea
          name="description"
          rows={3}
          value={form.description}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-gray-200"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Product Images (max 5)</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
        />
        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
            {images.map((img, idx) => (
              <div key={idx} className="relative group border rounded overflow-hidden">
                <img
                  src={img.url}
                  alt={`Image ${idx + 1}`}
                  className="w-full h-24 object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end pt-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-100">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || uploading}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition"
        >
          {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Product"}
        </button>
      </div>
    </form>
  );
}

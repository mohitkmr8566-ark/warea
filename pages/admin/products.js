// pages/admin/products.js
import AdminLayout from "@/components/admin/AdminLayout";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/store/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import ProductPreviewModal from "@/components/admin/ProductPreviewModal";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { isAdmin } from "@/lib/admin";

export default function AdminProductsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewProduct, setPreviewProduct] = useState(null);

  const [form, setForm] = useState({
    id: null,
    title: "",
    price: "",
    category: "",
    description: "",
    images: [],
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [progresses, setProgresses] = useState([]);
  const [saving, setSaving] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // 🧠 Firestore listener
  useEffect(() => {
    if (!user) return;
    if (!isAdmin(user)) {
      router.push("/");
      return;
    }

    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => {
          const data = d.data();
          const normalized =
            data.images && Array.isArray(data.images)
              ? data.images
              : data.image
              ? [data.image]
              : data.image_url
              ? [{ url: data.image_url, public_id: data.image_public_id }]
              : [];
          return { id: d.id, ...data, images: normalized };
        });
        setProducts(arr);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore listener error:", err);
        toast.error("Failed to load products");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  // 🖼️ Preview selected images
  useEffect(() => {
    if (!imageFiles.length) {
      setPreviews([]);
      setProgresses([]);
      return;
    }
    const urls = imageFiles.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    setProgresses(new Array(imageFiles.length).fill(0));
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [imageFiles]);

  const resetForm = () => {
    setForm({
      id: null,
      title: "",
      price: "",
      category: "",
      description: "",
      images: [],
    });
    setImageFiles([]);
    setPreviews([]);
    setProgresses([]);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImageFiles((prev) => [...prev, ...files]);
  };

  const removePreview = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setProgresses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEdit = (p) => {
    setForm({
      id: p.id,
      title: p.title || "",
      price: p.price || "",
      category: p.category || "",
      description: p.description || "",
      images: p.images || [],
    });
    setImageFiles([]);
    setPreviews([]);
    setProgresses([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 🗑️ Delete product
  const performDeletion = async (product, shouldDeleteImages = true) => {
    if (!product) return;
    setDeleteModalOpen(false);
    const toastId = toast.loading("Deleting product...");

    try {
      await deleteDoc(doc(db, "products", product.id));

      if (shouldDeleteImages && product.images?.length) {
        for (const img of product.images) {
          if (!img.public_id) continue;
          try {
            await fetch("/api/cloudinary-delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ public_id: img.public_id }),
            });
          } catch (err) {
            console.error("Failed to delete image:", err);
          }
        }
      }

      toast.success("Product deleted ✅");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete product ❌");
    } finally {
      toast.dismiss(toastId);
      setProductToDelete(null);
    }
  };

  // 🔼 Unsigned Cloudinary upload with REAL progress
  const uploadWithProgressUnsigned = (file, index) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const folder = "warea/products"; // ✅ Fixed folder path

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setProgresses((prev) => {
            const copy = [...prev];
            copy[index] = percent;
            return copy;
          });
        }
      });

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          const msg = xhr.responseText || `HTTP ${xhr.status} — Cloudinary upload error`;
          reject(new Error(msg));
        }
      };

      xhr.onerror = () => reject(new Error("Upload failed"));

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", preset);
      formData.append("folder", folder); // ✅ enforce folder
      xhr.send(formData);
    });
  };

  // ⚙️ Save / Update Product
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) {
      toast.error("Title and price are required");
      return;
    }

    setSaving(true);
    try {
      let uploadedImages = [];

      if (imageFiles.length > 0) {
        const uploadToast = toast.loading("Uploading images...");
        uploadedImages = await Promise.all(
          imageFiles.map(async (file, i) => {
            try {
              const res = await uploadWithProgressUnsigned(file, i);
              return { url: res.secure_url, public_id: res.public_id };
            } catch (err) {
              console.error("Upload failed:", err);
              toast.error(`Failed to upload ${file.name}`);
              return null;
            }
          })
        );
        uploadedImages = uploadedImages.filter(Boolean);
        toast.dismiss(uploadToast);
        if (uploadedImages.length) toast.success("All images uploaded ✅");
      }

      const finalImages =
        form.id && form.images?.length
          ? [...form.images, ...uploadedImages]
          : uploadedImages.length
          ? uploadedImages
          : form.images || [];

      const payload = {
        title: form.title,
        price: Number(form.price),
        category: form.category || "",
        description: form.description || "",
        images: finalImages,
        updatedAt: serverTimestamp(),
        image_url: null, // 🧹 Clear legacy fields
        image: null,
      };

      if (form.id) {
        await updateDoc(doc(db, "products", form.id), payload);
        toast.success("Product updated ✅");
      } else {
        await addDoc(collection(db, "products"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success("Product created ✅");
      }

      resetForm();
    } catch (err) {
      console.error("save product error:", err);
      toast.error("Failed to save product ❌");
    } finally {
      setSaving(false);
    }
  };

  // 🧮 Stats
  const totals = useMemo(
    () => ({
      count: products.length,
      revenue: products.reduce((s, p) => s + Number(p.price || 0), 0),
    }),
    [products]
  );

  if (!user)
    return (
      <div className="page-container py-12 text-center">
        Please sign in as admin to view this page.
      </div>
    );

  if (!isAdmin(user))
    return (
      <div className="page-container py-12 text-center text-red-600">
        Access denied. Admin only.
      </div>
    );

  return (
    <AdminLayout>
      <Head>
        <title>Admin — Products</title>
      </Head>

      <div className="page-container py-8">
        <h1 className="text-3xl font-bold mb-6">Products Manager</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* ➕ Form */}
          <div className="md:col-span-1 bg-white rounded-xl shadow p-4 border border-gray-100">
            <h3 className="font-medium mb-3">
              {form.id ? "Edit Product" : "Add Product"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-sm">Title</label>
              <input
                className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-black/10"
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              />

              <label className="block text-sm">Price (INR)</label>
              <input
                type="number"
                min="0"
                className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-black/10"
                value={form.price}
                onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
              />

              <label className="block text-sm">Category</label>
              <input
                className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-black/10"
                value={form.category}
                onChange={(e) =>
                  setForm((s) => ({ ...s, category: e.target.value }))
                }
              />

              <label className="block text-sm">Description</label>
              <textarea
                className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-black/10"
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm((s) => ({ ...s, description: e.target.value }))
                }
              />

              {/* 🧩 Drag & Drop Upload Zone */}
              <label className="block text-sm font-medium mb-1">
                Product Images
              </label>
              <div
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files || []);
                  if (files.length) setImageFiles((prev) => [...prev, ...files]);
                }}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 transition"
              >
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="fileInput"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-10 h-10 text-gray-400 mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 0115.9 6h1.1a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <span className="text-gray-600 text-sm">
                    Drag & drop images here or{" "}
                    <span className="underline font-medium">browse</span>
                  </span>
                </label>
              </div>

              {/* 🖼️ Previews + Per-file Progress */}
              {previews.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {previews.map((src, i) => (
                    <div key={i} className="relative w-24 h-24 group">
                      <img
                        src={src}
                        alt={`preview-${i}`}
                        className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removePreview(i)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-80 hover:opacity-100"
                      >
                        ✕
                      </button>
                      {progresses[i] > 0 && progresses[i] < 100 && (
                        <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="bg-yellow-500 h-full transition-all duration-300"
                            style={{ width: `${progresses[i]}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button
                  disabled={saving}
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition disabled:opacity-60"
                >
                  {form.id ? "Save Changes" : "Create Product"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="border px-4 py-2 rounded hover:bg-gray-100"
                >
                  Reset
                </button>
              </div>
            </form>

            <div className="mt-4 text-sm text-gray-500">
              Secure multi-image uploads with live progress tracking.
            </div>
          </div>

          {/* 📋 Product List */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">All Products ({totals.count})</h3>
                <div className="text-sm text-gray-600">
                  Total revenue: ₹{totals.revenue}
                </div>
              </div>

              {loading ? (
                <p className="text-gray-500">Loading products...</p>
              ) : products.length === 0 ? (
                <p className="text-gray-500">No products yet.</p>
              ) : (
                <div className="space-y-3">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between border rounded p-3 hover:shadow-sm transition cursor-pointer"
                      onClick={() => setPreviewProduct(p)}
                    >
                      <div className="flex items-center gap-4">
                        {p.images?.length ? (
                          <img
                            src={p.images[0].url}
                            alt={p.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs">
                            No image
                          </div>
                        )}
                        <div>
                          <div className="font-semibold">{p.title}</div>
                          <div className="text-xs text-gray-500">
                            {p.category}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold">₹{p.price}</div>
                        <div className="text-xs text-gray-500 truncate w-52">
                          {p.description}
                        </div>
                        <div className="mt-2 flex gap-2 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(p);
                            }}
                            className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setProductToDelete(p);
                              setDeleteModalOpen(true);
                            }}
                            className="px-3 py-1 bg-red-50 text-red-600 rounded text-sm border hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-4 text-sm text-gray-600">
              <p>
                <strong>Cloudinary:</strong> unsigned uploads + fixed folder ✅
              </p>
              <p className="mt-2">
                Firestore + Cloudinary sync & legacy cleanup active.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ProductPreviewModal
        product={previewProduct}
        onClose={() => setPreviewProduct(null)}
      />

      <DeleteConfirmModal
        open={deleteModalOpen}
        product={productToDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={(deleteImages) => performDeletion(productToDelete, deleteImages)}
      />
    </AdminLayout>
  );
}

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
import { uploadToCloudinary } from "@/lib/cloudinary";
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
    imageUrl: "",
    imagePublicId: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  // 🧩 Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // 🔐 Admin guard + live Firestore listener
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
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(arr);
        setLoading(false);
      },
      (err) => {
        console.error("products listener error:", err);
        toast.error("Failed to load products");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  // 🖼️ Preview image file
  useEffect(() => {
    if (!imageFile) {
      setPreview(form.imageUrl || null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile, form.imageUrl]);

  const resetForm = () => {
    setForm({
      id: null,
      title: "",
      price: "",
      category: "",
      description: "",
      imageUrl: "",
      imagePublicId: "",
    });
    setImageFile(null);
    setPreview(null);
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
  };

  const handleEdit = (p) => {
    setForm({
      id: p.id,
      title: p.title || "",
      price: p.price || "",
      category: p.category || "",
      description: p.description || "",
      imageUrl: p.image?.url || "",
      imagePublicId: p.image?.public_id || "",
    });
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ⚡ Perform Firestore + Cloudinary deletion (called from modal)
  const performDeletion = async (product, shouldDeleteImages = true) => {
    if (!product) return;
    setDeleteModalOpen(false);
    const toastId = toast.loading("Deleting product...");

    try {
      // 🗑️ 1. Delete from Firestore
      await deleteDoc(doc(db, "products", product.id));

      // ☁️ 2. Delete from Cloudinary (optional)
      if (shouldDeleteImages) {
        const publicIds = [];
        if (Array.isArray(product.images)) {
          product.images.forEach((it) => {
            if (it?.public_id) publicIds.push(it.public_id);
          });
        } else if (product.image?.public_id) {
          publicIds.push(product.image.public_id);
        }

        for (const pid of publicIds) {
          try {
            const res = await fetch("/api/cloudinary-delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ public_id: pid }),
            });
            if (!res.ok) {
              const err = await res.text();
              console.error("Cloudinary delete failed for", pid, err);
            }
          } catch (err) {
            console.error("Cloudinary delete request failed:", err);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.price) {
      toast.error("Title and price are required");
      return;
    }

    setSaving(true);
    try {
      let image = { url: form.imageUrl || "", public_id: form.imagePublicId || "" };

      if (imageFile) {
        const uploadToast = toast.loading("Uploading image...");
        const res = await uploadToCloudinary(imageFile);
        image = { url: res.secure_url, public_id: res.public_id };
        toast.dismiss(uploadToast);
        toast.success("Image uploaded");
      }

      const payload = {
        title: form.title,
        price: Number(form.price),
        category: form.category || "",
        description: form.description || "",
        image,
        updatedAt: serverTimestamp(),
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
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

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
          <div className="md:col-span-1 bg-white rounded-lg shadow p-4 border border-gray-100">
            <h3 className="font-medium mb-3">
              {form.id ? "Edit Product" : "Add Product"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-sm">Title</label>
              <input
                className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-black/10"
                value={form.title}
                onChange={(e) =>
                  setForm((s) => ({ ...s, title: e.target.value }))
                }
              />

              <label className="block text-sm">Price (INR)</label>
              <input
                type="number"
                min="0"
                className="w-full border px-3 py-2 rounded focus:ring-2 focus:ring-black/10"
                value={form.price}
                onChange={(e) =>
                  setForm((s) => ({ ...s, price: e.target.value }))
                }
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
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm((s) => ({ ...s, description: e.target.value }))
                }
              />

              <label className="block text-sm">Image</label>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {preview && (
                <div className="mt-2">
                  <img
                    src={preview}
                    alt="preview"
                    className="w-full rounded-md object-cover shadow-sm"
                  />
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button
                  disabled={saving}
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition"
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
              Note: Images are uploaded via your Cloudinary unsigned preset.
            </div>
          </div>

          {/* 📋 Product List */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">
                  All Products ({totals.count})
                </h3>
                <div className="text-sm text-gray-600">
                  Total revenue (raw sum): ₹{totals.revenue}
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
                        {p.image?.url ? (
                          <img
                            src={p.image.url}
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
                <strong>Cloudinary preset:</strong> uploads use your unsigned preset
                `unsigned_warea`.
              </p>
              <p className="mt-2">
                Cloudinary delete integration and confirmation modal are active ✅
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 Product Preview Modal */}
      <ProductPreviewModal
        product={previewProduct}
        onClose={() => setPreviewProduct(null)}
      />

      {/* ❌ Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        product={productToDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={(deleteImages) =>
          performDeletion(productToDelete, deleteImages)
        }
      />
    </AdminLayout>
  );
}

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

const ADMIN_EMAIL = "mohitkmr8566@gmail.com";

export default function AdminProductsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // admin guard + live products listener
  useEffect(() => {
    if (!user) return;
    if (user?.email !== ADMIN_EMAIL) {
      router.push("/");
      return;
    }

    setLoading(true);
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
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  // preview local file
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
  };

  const handleDelete = async (p) => {
    if (!confirm("Delete product? This removes the product from Firestore. Cloudinary asset will remain (we can add server-side deletion later).")) return;
    try {
      await deleteDoc(doc(db, "products", p.id));
      toast.success("Product removed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete product");
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

      // If a new file selected -> upload to Cloudinary
      if (imageFile) {
        toast.loading("Uploading image...");
        const res = await uploadToCloudinary(imageFile);
        image = { url: res.secure_url, public_id: res.public_id };
        toast.dismiss();
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
        // update
        const ref = doc(db, "products", form.id);
        await updateDoc(ref, payload);
        toast.success("Product updated");
      } else {
        // create
        await addDoc(collection(db, "products"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success("Product created");
      }

      resetForm();
    } catch (err) {
      console.error("save product error:", err);
      toast.error("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const totals = useMemo(() => {
    return {
      count: products.length,
      revenue: products.reduce((s, p) => s + (Number(p.price || 0)), 0),
    };
  }, [products]);

  if (!user) {
    return <div className="page-container py-12 text-center">Please sign in as admin to view this page.</div>;
  }
  if (user.email !== ADMIN_EMAIL) {
    return <div className="page-container py-12 text-center text-red-600">Access denied. Admin only.</div>;
  }

  return (
    <AdminLayout>
      <Head>
        <title>Admin — Products</title>
      </Head>

      <div className="page-container py-8">
        <h1 className="text-3xl font-bold mb-6">Products Manager</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Form */}
          <div className="md:col-span-1 bg-white rounded-lg shadow p-4">
            <h3 className="font-medium mb-3">{form.id ? "Edit Product" : "Add Product"}</h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-sm">Title</label>
              <input className="w-full border px-3 py-2 rounded" value={form.title} onChange={(e) => setForm(s => ({ ...s, title: e.target.value }))} />

              <label className="block text-sm">Price (INR)</label>
              <input type="number" min="0" className="w-full border px-3 py-2 rounded" value={form.price} onChange={(e) => setForm(s => ({ ...s, price: e.target.value }))} />

              <label className="block text-sm">Category</label>
              <input className="w-full border px-3 py-2 rounded" value={form.category} onChange={(e) => setForm(s => ({ ...s, category: e.target.value }))} />

              <label className="block text-sm">Description</label>
              <textarea className="w-full border px-3 py-2 rounded" rows={3} value={form.description} onChange={(e) => setForm(s => ({ ...s, description: e.target.value }))} />

              <label className="block text-sm">Image</label>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {preview && (
                <div className="mt-2">
                  <img src={preview} alt="preview" className="w-full rounded-md object-cover" />
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button disabled={saving} className="btn btn-primary px-4 py-2">
                  {form.id ? "Save Changes" : "Create Product"}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-ghost px-4 py-2">Reset</button>
              </div>
            </form>

            <div className="mt-4 text-sm text-gray-500">
              Note: Images are uploaded via your Cloudinary unsigned preset.
            </div>
          </div>

          {/* List */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">All Products ({totals.count})</h3>
                <div className="text-sm text-gray-600">Total revenue (raw sum): ₹{totals.revenue}</div>
              </div>

              {loading ? (
                <p className="text-gray-500">Loading products...</p>
              ) : products.length === 0 ? (
                <p className="text-gray-500">No products yet.</p>
              ) : (
                <div className="space-y-3">
                  {products.map((p) => (
                    <div key={p.id} className="flex items-center justify-between border rounded p-3">
                      <div className="flex items-center gap-4">
                        {p.image?.url ? (
                          <img src={p.image.url} alt={p.title} className="w-16 h-16 object-cover rounded" />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-xs">No image</div>
                        )}
                        <div>
                          <div className="font-semibold">{p.title}</div>
                          <div className="text-xs text-gray-500">{p.category}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold">₹{p.price}</div>
                        <div className="text-xs text-gray-500">{p.description?.slice(0, 80)}</div>
                        <div className="mt-2 flex gap-2 justify-end">
                          <button onClick={() => handleEdit(p)} className="px-3 py-1 border rounded text-sm">Edit</button>
                          <button onClick={() => handleDelete(p)} className="px-3 py-1 bg-red-50 text-red-600 rounded text-sm border">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* small help card */}
            <div className="bg-white rounded-lg shadow p-4 text-sm text-gray-600">
              <p><strong>Cloudinary preset:</strong> uploads use your unsigned preset `unsigned_warea` — created in Cloudinary settings.</p>
              <p className="mt-2">Want image delete from Cloudinary too? We'll add a server (signed) endpoint later that calls Cloudinary's destroy API (requires the API secret which must stay server-side).</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

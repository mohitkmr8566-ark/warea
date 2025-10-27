"use client";

import Head from "next/head";
import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuth } from "@/store/AuthContext";
import { isAdmin } from "@/lib/admin";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

export default function AdminHeroPage() {
  const { user } = useAuth();
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    id: null,
    title: "",
    subtitle: "",
    link: "/shop",
    order: 1,
    isActive: true,
    isDraft: false,
    image: null,
    startDate: "",
    endDate: "",
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  // 🔄 Live hero slides
  useEffect(() => {
    if (!user || !isAdmin(user)) return;
    const q = query(collection(db, "heroSlides"), orderBy("order", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSlides(arr);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        toast.error("Failed to load hero slides");
        setLoading(false);
      }
    );
    return () => unsub();
  }, [user]);

  // 🖼️ Preview
  useEffect(() => {
    if (!file) {
      setPreview("");
      setProgress(0);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const resetForm = () => {
    setForm({
      id: null,
      title: "",
      subtitle: "",
      link: "/shop",
      order: (slides?.length || 0) + 1,
      isActive: true,
      isDraft: false,
      image: null,
      startDate: "",
      endDate: "",
    });
    setFile(null);
    setPreview("");
    setProgress(0);
    setSaving(false);
  };

  const handleEdit = (s) => {
    setForm({
      id: s.id,
      title: s.title || "",
      subtitle: s.subtitle || "",
      link: s.link || "/shop",
      order: s.order || 1,
      isActive: s.isActive ?? true,
      isDraft: s.isDraft ?? false,
      image: s.image || null,
      startDate: s.startDate || "",
      endDate: s.endDate || "",
    });
    setFile(null);
    setPreview("");
    setProgress(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 📅 Auto activation logic
  const isWithinSchedule = (start, end) => {
    const now = new Date();
    const s = start ? new Date(start) : null;
    const e = end ? new Date(end) : null;
    if (s && now < s) return false;
    if (e && now > e) return false;
    return true;
  };

  // ☁️ Cloudinary unsigned upload
  const uploadWithProgressUnsigned = (file) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const folder = "warea/hero";
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setProgress(pct);
        }
      });
      xhr.onload = () => {
        if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
        else reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", preset);
      fd.append("folder", folder);
      xhr.send(fd);
    });
  };

  // 🪄 Handle Submit — Patched
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || form.title.trim() === "") {
      toast.error("Title is required");
      return;
    }
    if (!form.image && !file) {
      toast.error("Please select an image");
      return;
    }

    setSaving(true);
    try {
      let imageObj = form.image || null;

      // ☁️ Upload if new file selected
      if (file) {
        const t = toast.loading("Uploading image...");
        try {
          const res = await uploadWithProgressUnsigned(file);
          imageObj = { url: res.secure_url, public_id: res.public_id };
          toast.dismiss(t);
          toast.success("Image uploaded ✅");
        } catch (err) {
          console.error("❌ Image upload error:", err);
          toast.dismiss();
          toast.error("Image upload failed");
          setSaving(false);
          return;
        }
      }

      const activeBasedOnSchedule = isWithinSchedule(form.startDate, form.endDate);
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle || "",
        link: form.link || "/shop",
        order: Number(form.order) || 1,
        isActive: form.isDraft ? false : activeBasedOnSchedule,
        isDraft: !!form.isDraft,
        startDate: form.startDate || "",
        endDate: form.endDate || "",
        image: imageObj,
        updatedAt: serverTimestamp(),
      };

      if (form.id) {
        await updateDoc(doc(db, "heroSlides", form.id), payload);
        toast.success("Slide updated ✅");
      } else {
        await addDoc(collection(db, "heroSlides"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success("Slide created ✅");
      }

      resetForm();
    } catch (err) {
      console.error("❌ Failed to save hero slide:", err);
      toast.error("Failed to save slide");
      setSaving(false);
    }
  };

  const handleDelete = async (slide) => {
    if (!slide) return;
    if (!confirm("Delete this slide?")) return;
    const t = toast.loading("Deleting slide...");
    try {
      await deleteDoc(doc(db, "heroSlides", slide.id));
      if (slide.image?.public_id) {
        try {
          await fetch("/api/cloudinary-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ public_id: slide.image.public_id }),
          });
        } catch (e) {
          console.warn("Cloudinary delete failed:", e);
        }
      }
      toast.success("Slide deleted ✅");
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    } finally {
      toast.dismiss(t);
    }
  };

  const move = async (slide, dir = "up") => {
    const idx = slides.findIndex((s) => s.id === slide.id);
    const neighborIndex = dir === "up" ? idx - 1 : idx + 1;
    if (neighborIndex < 0 || neighborIndex >= slides.length) return;
    const neighbor = slides[neighborIndex];
    try {
      await Promise.all([
        updateDoc(doc(db, "heroSlides", slide.id), { order: neighbor.order }),
        updateDoc(doc(db, "heroSlides", neighbor.id), { order: slide.order }),
      ]);
    } catch (err) {
      console.error(err);
      toast.error("Reorder failed");
    }
  };

  if (!user)
    return <div className="page-container py-12 text-center">Please sign in as admin to view this page.</div>;

  if (!isAdmin(user))
    return <div className="page-container py-12 text-center text-red-600">Access denied. Admin only.</div>;

  return (
    <AdminLayout>
      <Head>
        <title>Admin — Hero Manager</title>
      </Head>

      <div className="page-container py-8">
        <h1 className="text-3xl font-bold mb-6">Hero Banner Manager</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Form */}
          <div className="md:col-span-1 bg-white rounded-xl shadow p-4 border border-gray-100">
            <h3 className="font-medium mb-3">{form.id ? "Edit Slide" : "Add Slide"}</h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-sm">Title</label>
              <input
                className="w-full border px-3 py-2 rounded"
                value={form.title}
                onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              />

              <label className="block text-sm">Subtitle (optional)</label>
              <input
                className="w-full border px-3 py-2 rounded"
                value={form.subtitle}
                onChange={(e) => setForm((s) => ({ ...s, subtitle: e.target.value }))}
              />

              <label className="block text-sm">Button Link</label>
              <input
                className="w-full border px-3 py-2 rounded"
                value={form.link}
                onChange={(e) => setForm((s) => ({ ...s, link: e.target.value }))}
              />

              {/* Schedule fields */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm">Start Date</label>
                  <input
                    type="datetime-local"
                    className="w-full border px-3 py-2 rounded"
                    value={form.startDate}
                    onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm">End Date</label>
                  <input
                    type="datetime-local"
                    className="w-full border px-3 py-2 rounded"
                    value={form.endDate || ""}
                    min={form.startDate || ""}
                    disabled={!form.startDate}
                    onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))}
                  />
                  Active
                </label>

                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isDraft}
                    onChange={(e) => setForm((s) => ({ ...s, isDraft: e.target.checked }))}
                  />
                  Draft
                </label>

                <div className="flex items-center gap-2">
                  <label className="text-sm">Order</label>
                  <input
                    type="number"
                    min="1"
                    className="w-20 border px-2 py-1 rounded"
                    value={form.order}
                    onChange={(e) => setForm((s) => ({ ...s, order: e.target.value }))}
                  />
                </div>
              </div>

              {/* Upload */}
              <label className="block text-sm font-medium">Hero Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <input
                  id="heroFile"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="heroFile" className="cursor-pointer">
                  <div className="text-gray-600 text-sm">
                    Click to upload or drag & drop (16:9 works best)
                  </div>
                </label>

                {(preview || form.image?.url) && (
                  <div className="mt-4">
                    <img
                      src={preview || form.image?.url}
                      alt="preview"
                      className="w-full h-40 object-cover rounded border"
                    />
                  </div>
                )}

                {progress > 0 && progress < 100 && (
                  <div className="mt-3 w-full bg-gray-200 h-2 rounded overflow-hidden">
                    <div className="bg-yellow-500 h-2" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  disabled={saving}
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition disabled:opacity-60"
                >
                  {form.id ? "Save Changes" : "Create Slide"}
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

            <p className="text-xs text-gray-500 mt-3">
              Tip: set a smaller <b>order</b> to show a slide earlier in the carousel.
            </p>
          </div>

          {/* List */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow p-4 border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">All Slides ({slides.length})</h3>
                <div className="text-sm text-gray-600">
                  Active: {slides.filter((s) => s.isActive).length} | Draft:{" "}
                  {slides.filter((s) => s.isDraft).length}
                </div>
              </div>

              {loading ? (
                <p className="text-gray-500">Loading slides...</p>
              ) : slides.length === 0 ? (
                <p className="text-gray-500">No slides yet. Add one on the left.</p>
              ) : (
                <div className="space-y-3">
                  {slides.map((s, idx) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between border rounded p-3 hover:shadow-sm transition"
                    >
                      <div className="flex items-center gap-4">
                        {s.image?.url ? (
                          <img
                            src={s.image.url}
                            alt={s.title}
                            className="w-28 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-28 h-16 bg-gray-100 rounded flex items-center justify-center text-xs">
                            No image
                          </div>
                        )}
                        <div>
                          <div className="font-semibold">{s.title}</div>
                          <div className="text-xs text-gray-500 line-clamp-1">{s.subtitle}</div>
                          <div className="text-xs text-gray-500">
                            Link: <span className="font-mono">{s.link}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {s.startDate ? (
                              <>
                                {new Date(s.startDate).toLocaleString()} →{" "}
                                {s.endDate ? new Date(s.endDate).toLocaleString() : "∞"}
                              </>
                            ) : (
                              <span>No schedule</span>
                            )}
                          </div>
                          <div className="text-xs">
                            <span className="mr-2">Order: <b>{s.order}</b></span>
                            {s.isDraft ? (
                              <span className="text-yellow-600 font-medium">Draft</span>
                            ) : s.isActive ? (
                              <span className="text-green-600 font-medium">Active</span>
                            ) : (
                              <span className="text-red-600 font-medium">Inactive</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => move(s, "up")}
                          disabled={idx === 0}
                          className="px-3 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-40"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => move(s, "down")}
                          disabled={idx === slides.length - 1}
                          className="px-3 py-1 border rounded text-sm hover:bg-gray-50 disabled:opacity-40"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleEdit(s)}
                          className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="px-3 py-1 bg-red-50 text-red-600 rounded text-sm border hover:bg-red-100"
                        >
                          Delete
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, "heroSlides", s.id), {
                                isActive: !s.isActive,
                                updatedAt: serverTimestamp(),
                              });
                            } catch (e) {
                              console.error(e);
                              toast.error("Toggle failed");
                            }
                          }}
                          className="px-3 py-1 border rounded text-sm hover:bg-gray-50"
                        >
                          {s.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow p-4 text-sm text-gray-600">
              <p>
                <strong>Cloudinary:</strong> folder <code>warea/hero</code> • keep images 16:9 / 3:2 for the best fit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

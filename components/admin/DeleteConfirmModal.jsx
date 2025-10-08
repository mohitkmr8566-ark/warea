// components/admin/DeleteConfirmModal.jsx
"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

export default function DeleteConfirmModal({ open, product, onCancel, onConfirm }) {
  // onConfirm(deleteImages: boolean) -> called when user confirms deletion
  const [deleteImages, setDeleteImages] = useState(true);

  useEffect(() => {
    if (open) setDeleteImages(true);
  }, [open]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[999] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/60"
          onClick={onCancel}
          aria-hidden="true"
        />

        {/* modal */}
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ y: 20, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="relative bg-white rounded-lg shadow-xl w-[90%] max-w-md p-5 mx-4"
        >
          <button
            onClick={onCancel}
            className="absolute top-3 right-3 text-gray-500 hover:text-black"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded bg-red-50 text-red-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Delete product</h3>
              <p className="text-sm text-gray-600 mt-1">
                This action will permanently delete the product. You can also choose to remove stored images from Cloudinary.
              </p>
            </div>
          </div>

          {product && (
            <div className="mt-4 flex gap-3">
              <div className="w-20 h-20 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                <img
                  src={
                    product.images?.[0]?.url ||
                    product.image?.url ||
                    "/placeholder.jpg"
                  }
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="font-medium">{product.title}</div>
                {product.category && (
                  <div className="text-xs text-gray-500">{product.category}</div>
                )}
                {product.description && (
                  <div className="mt-2 text-sm text-gray-700 line-clamp-3">
                    {product.description}
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500">Product ID: {product.id}</div>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2">
            <input
              id="deleteImages"
              type="checkbox"
              checked={deleteImages}
              onChange={(e) => setDeleteImages(e.target.checked)}
              className="w-4 h-4 rounded border"
            />
            <label htmlFor="deleteImages" className="text-sm text-gray-700">
              Also delete image(s) from Cloudinary
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded border hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              onClick={() => onConfirm?.(deleteImages)}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              Delete Permanently
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

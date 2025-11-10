"use client";
import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STATUS_STEPS } from "@/lib/constants";
import { ensureDate } from "@/lib/utils";

export default function OrderTimelineModal({ open, onClose, order }) {
  // ✅ Current status index (fallback = -1)
  const statusIndex = STATUS_STEPS.findIndex((s) => s.key === order?.status);

  // ✅ Close on ESC key
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  // ✅ Handle click outside modal
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose?.();
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={handleBackdropClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            className="bg-white rounded-lg shadow-lg max-w-md w-full p-5 relative"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Order Timeline</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-800 text-xl"
                aria-label="Close timeline"
              >
                ✕
              </button>
            </div>

            {/* Timeline */}
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-2">
              {STATUS_STEPS.map((step, idx) => {
                const timestamp = order?.statusTimestamps?.[step.key];
                const date = timestamp ? ensureDate(timestamp) : null;

                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div
                      className={`w-5 h-5 rounded-full flex-shrink-0 mt-1 ${
                        idx <= statusIndex
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    ></div>

                    <div className="overflow-hidden">
                      <p className="font-medium text-sm">{step.label}</p>
                      {date && (
                        <p className="text-xs text-gray-500 truncate">
                          {date.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";
import { motion, AnimatePresence } from "framer-motion";
import { STATUS_STEPS } from "@/lib/constants";
import { ensureDate } from "@/lib/utils";

export default function OrderTimelineModal({ open, onClose, order }) {
  const statusIndex = STATUS_STEPS.findIndex(s => s.key === order?.status);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-lg shadow-lg max-w-md w-full p-5"
            initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }}
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Order Timeline</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>
            <div className="space-y-4">
              {STATUS_STEPS.map((step, idx) => (
                <div key={step.key} className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full ${idx <= statusIndex ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <div>
                    <p className="font-medium text-sm">{step.label}</p>
                    {order?.statusTimestamps?.[step.key] && (
                      <p className="text-xs text-gray-500">
                        {ensureDate(order?.statusTimestamps[step.key]).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

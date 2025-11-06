// components/auth/ForgotPasswordModal.jsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useAuth } from "@/store/AuthContext";

export default function ForgotPasswordModal({ open, onClose }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      await resetPassword(email);
      onClose(); // Close modal after success
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl relative"
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 transition"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} />
            </button>

            {/* Modal Title */}
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Forgot Password?
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Enter your email and we’ll send you a reset link.
            </p>

            {/* Form */}
            <form onSubmit={handleReset} className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-full hover:bg-gray-800 transition disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

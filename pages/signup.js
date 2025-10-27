"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/store/AuthContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function SignupPage() {
  const { signup, googleLogin } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await signup(form.email, form.password);
      toast.success("Account created successfully!");
      router.push("/profile");
    } catch (err) {
      toast.error("Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await googleLogin();
      toast.success("Signed up with Google!");
      router.push("/profile");
    } catch {
      toast.error("Google signup failed.");
    }
  };

  return (
    <>
      {/* ✨ Header */}
      <section className="bg-gradient-to-b from-gray-50 to-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-serif font-bold mb-3"
          >
            Create Your Account
          </motion.h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto">
            Sign up to access exclusive collections and your personal wishlist.
          </p>
        </div>
      </section>

      {/* 📝 Signup Card */}
      <main className="px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-lg border border-gray-100"
        >
          <h2 className="text-2xl font-semibold text-center mb-6">Sign Up</h2>
          <form onSubmit={submit} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-full hover:bg-gray-800 transition disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-5">
            <button
              onClick={handleGoogle}
              className="w-full border rounded-full py-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition"
            >
              <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
          </div>

          <p className="text-center mt-6 text-sm text-gray-500">
            Already have an account?{" "}
            <a href="/login" className="text-yellow-600 hover:underline font-medium">
              Login
            </a>
          </p>
        </motion.div>
      </main>
    </>
  );
}

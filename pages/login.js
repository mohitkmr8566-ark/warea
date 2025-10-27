"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/store/AuthContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { login, googleLogin } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(form.email, form.password);
      toast.success("Welcome back!");
      router.push("/profile");
    } catch (err) {
      toast.error("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await googleLogin();
      toast.success("Logged in with Google!");
      router.push("/profile");
    } catch {
      toast.error("Google login failed.");
    }
  };

  return (
    <>
      {/* ✨ Header Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-serif font-bold mb-3"
          >
            Welcome Back
          </motion.h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto">
            Log in to access your orders, wishlist, and account details.
          </p>
        </div>
      </section>

      {/* 🧾 Login Card */}
      <main className="px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-lg border border-gray-100"
        >
          <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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
              {loading ? "Logging in..." : "Login"}
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
            Don’t have an account?{" "}
            <a href="/signup" className="text-yellow-600 hover:underline font-medium">
              Sign up
            </a>
          </p>
        </motion.div>
      </main>
    </>
  );
}

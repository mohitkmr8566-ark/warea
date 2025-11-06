// pages/login.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/store/AuthContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";

export default function LoginPage() {
  const router = useRouter();
  const { login, googleLogin } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  // Save last visited page before login
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("returnTo", document.referrer || "/profile");
    }
  }, []);

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
      {/* Header Section */}
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
            Log in to access your orders, wishlist, and account.
          </p>
        </div>
      </section>

      {/* Login Form */}
      <main className="px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-lg border border-gray-100"
        >
          <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
              required
            />

            {/* Password Field with Toggle */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border rounded-lg px-4 py-3 pr-12 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 p-1 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-sm text-amber-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-full hover:bg-gray-800 transition disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center">
            <span className="flex-1 h-px bg-gray-200" />
            <span className="px-3 text-xs text-gray-400">OR</span>
            <span className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogle}
            className="w-full border rounded-full py-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition"
          >
            <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          {/* Signup Link */}
          <p className="text-center mt-6 text-sm text-gray-500">
            Don’t have an account?{" "}
            <a href="/signup" className="text-amber-600 hover:underline font-medium">
              Sign up
            </a>
          </p>
        </motion.div>
      </main>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </>
  );
}

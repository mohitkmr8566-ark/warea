// pages/signup.js
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/store/AuthContext";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const { signup, googleLogin } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Save return path before signup
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("returnTo", document.referrer || "/profile");
    }
  }, []);

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
      {/* Header */}
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
            Sign up to access exclusive collections and manage your orders & wishlist.
          </p>
        </div>
      </section>

      {/* Signup Form */}
      <main className="px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-lg border border-gray-100"
        >
          <h2 className="text-2xl font-semibold text-center mb-6">Sign Up</h2>
          <form onSubmit={submit} className="space-y-4">
            {/* Email */}
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition"
              required
            />

            {/* Password with eye toggle */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-full hover:bg-gray-800 transition disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center">
            <span className="flex-1 h-px bg-gray-200" />
            <span className="px-3 text-xs text-gray-400">OR</span>
            <span className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Google Signup */}
          <button
            onClick={handleGoogle}
            className="w-full border rounded-full py-3 flex items-center justify-center gap-2 hover:bg-gray-50 transition"
          >
            <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          {/* Login Link */}
          <p className="text-center mt-6 text-sm text-gray-500">
            Already have an account?{" "}
            <a href="/login" className="text-amber-600 hover:underline font-medium">
              Login
            </a>
          </p>
        </motion.div>
      </main>
    </>
  );
}

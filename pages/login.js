// pages/login.js
"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/store/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const u = await login({ email, password });
    if (u) router.push("/profile");
  };

  return (
    <div className="page-container py-16 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Login</h1>
      <form onSubmit={submit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-2 border rounded" />
        <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-2 border rounded" />
        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary">Login</button>
          <a href="/signup" className="btn btn-ghost">Create account</a>
        </div>
      </form>
    </div>
  );
}

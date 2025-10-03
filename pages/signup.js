// pages/signup.js
"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/store/AuthContext";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const u = await signup({ name, email, password });
    if (u) router.push("/profile");
  };

  return (
    <div className="page-container py-16 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Create Account</h1>
      <form onSubmit={submit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Full name" className="w-full px-4 py-2 border rounded" />
        <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" className="w-full px-4 py-2 border rounded" />
        <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-2 border rounded" />
        <div className="flex gap-3">
          <button type="submit" className="btn btn-primary">Create Account</button>
          <a href="/login" className="btn btn-ghost">Login</a>
        </div>
      </form>
    </div>
  );
}

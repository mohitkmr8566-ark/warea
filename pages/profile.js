import Head from "next/head";
import { useState } from "react";
import { useAuth } from "@/store/AuthContext";

export default function ProfilePage() {
  const { user, login, logout, signup, googleLogin } = useAuth();
  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    await login(form.email, form.password);
    setForm({ email: "", name: "", password: "" });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    await signup(form.email, form.password, form.name);
    setForm({ email: "", name: "", password: "" });
  };

  return (
    <>
      <Head>
        <title>Profile — Warea</title>
      </Head>

      <main className="page-container py-10">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Profile</h1>

        {!user ? (
          <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow">
            {/* Tabs */}
            <div className="flex gap-4 mb-6 justify-center">
              <button
                className={`px-4 py-2 rounded ${
                  tab === "login"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => setTab("login")}
              >
                Login
              </button>
              <button
                className={`px-4 py-2 rounded ${
                  tab === "signup"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
                onClick={() => setTab("signup")}
              >
                Sign up
              </button>
            </div>

            {/* Login Form */}
            {tab === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, email: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, password: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                />
                <button
                  type="submit"
                  className="btn btn-primary w-full mt-2 bg-gray-900 text-white py-2 rounded hover:bg-gray-700"
                >
                  Login
                </button>

                {/* Google Login */}
                <button
                  type="button"
                  onClick={() => googleLogin()}
                  className="btn btn-ghost w-full mt-3 border flex items-center justify-center gap-2 py-2 rounded hover:bg-gray-100"
                >
                  <img
                    src="/google-icon.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  Continue with Google
                </button>
              </form>
            ) : (
              // Signup Form
              <form onSubmit={handleSignup} className="space-y-4">
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, name: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                />
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, email: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, password: e.target.value }))
                  }
                  className="w-full border px-3 py-2 rounded"
                />
                <button
                  type="submit"
                  className="btn btn-primary w-full mt-2 bg-gray-900 text-white py-2 rounded hover:bg-gray-700"
                >
                  Create account
                </button>

                {/* Google Signup */}
                <button
                  type="button"
                  onClick={() => googleLogin()}
                  className="btn btn-ghost w-full mt-3 border flex items-center justify-center gap-2 py-2 rounded hover:bg-gray-100"
                >
                  <img
                    src="/google-icon.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  Continue with Google
                </button>
              </form>
            )}
          </div>
        ) : (
          // Logged-in view
          <div className="grid md:grid-cols-3 gap-6">
            <aside className="md:col-span-1 bg-white p-4 rounded-lg shadow">
              <h2 className="font-medium mb-2">Account</h2>
              <div className="text-sm text-gray-700">
                <p>
                  Name: <strong>{user.name}</strong>
                </p>
                <p className="mt-1">
                  Email: <strong>{user.email}</strong>
                </p>
              </div>
              <button
                className="mt-4 btn btn-ghost bg-gray-100 w-full py-2 rounded hover:bg-gray-200"
                onClick={() => logout()}
              >
                Logout
              </button>
            </aside>

            <section className="md:col-span-2 space-y-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium mb-2">Orders</h3>
                <p className="text-sm text-gray-500">
                  No orders yet — this will show past orders after checkout.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium mb-2">Addresses</h3>
                <p className="text-sm text-gray-500">
                  Add an address to speed up checkout.
                </p>
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  );
}

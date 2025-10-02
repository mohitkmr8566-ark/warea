"use client";

import { useState } from "react";
import Head from "next/head";

export default function ProfilePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // placeholder state

  return (
    <>
      <Head>
        <title>Profile — Warea</title>
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Your Profile</h1>

        {!isLoggedIn ? (
          // 🔹 Show Login / Signup placeholders
          <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-medium mb-4 text-center">Welcome to Warea</h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              Please log in to access your account, orders, and saved addresses.
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => alert("Login flow will go here")}
                className="w-full px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-700"
              >
                Login
              </button>
              <button
                onClick={() => alert("Signup flow will go here")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Create Account
              </button>
            </div>
          </div>
        ) : (
          // 🔹 Show Account Dashboard (once logged in)
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <aside className="md:col-span-1 bg-white p-4 rounded-lg shadow">
              <h2 className="font-medium mb-2">Account</h2>
              <div className="text-sm text-gray-700">
                <p>
                  Name: <strong>Guest User</strong>
                </p>
                <p className="mt-1">
                  Email: <strong>guest@warea.local</strong>
                </p>
              </div>
            </aside>

            <section className="md:col-span-2 space-y-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-medium mb-2">Orders</h3>
                <p className="text-sm text-gray-500">
                  No orders yet. Orders will appear here once you complete a checkout.
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

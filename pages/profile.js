// pages/profile.js
import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/store/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export default function ProfilePage() {
  const { user, logout, login, signup, googleLogin } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState("login");
  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [coupons, setCoupons] = useState([]);

  const [profileInfo, setProfileInfo] = useState({ name: "", phone: "", avatarUrl: "" });

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });

  const [newPayment, setNewPayment] = useState({
    cardNumber: "",
    nameOnCard: "",
    expiry: "",
  });

  // 🧭 Fetch Orders
  useEffect(() => {
    if (!user?.email) return;
    const q = query(
      collection(db, "orders"),
      where("userId", "==", user.email),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  // 🏡 Fetch Addresses
  useEffect(() => {
    if (!user?.email) return;
    const q = query(collection(db, "users", user.email, "addresses"));
    const unsub = onSnapshot(q, (snap) => {
      setAddresses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  // 💳 Fetch Payment Methods
  useEffect(() => {
    if (!user?.email) return;
    const q = query(collection(db, "users", user.email, "paymentMethods"));
    const unsub = onSnapshot(q, (snap) => {
      setPayments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  // 🔔 Notifications
  useEffect(() => {
    if (!user?.email) return;
    const q = query(collection(db, "users", user.email, "notifications"));
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  // 🎁 Coupons
  useEffect(() => {
    if (!user?.email) return;
    const q = query(collection(db, "users", user.email, "coupons"));
    const unsub = onSnapshot(q, (snap) => {
      setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  // 👤 Profile Info
  useEffect(() => {
    if (!user?.email) return;
    const ref = doc(db, "users", user.email);
    getDoc(ref).then((snap) => {
      if (snap.exists()) setProfileInfo(snap.data());
    });
  }, [user]);

  // ➕ Add Address
  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!user?.email) return;
    if (newAddress.isDefault) {
      const currentDefault = addresses.find((a) => a.isDefault);
      if (currentDefault) {
        await updateDoc(doc(db, "users", user.email, "addresses", currentDefault.id), {
          isDefault: false,
        });
      }
    }
    await addDoc(collection(db, "users", user.email, "addresses"), newAddress);
    setNewAddress({
      name: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
    });
    setShowAddressModal(false);
  };

  // ➕ Add Payment
  const handleAddPayment = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "users", user.email, "paymentMethods"), newPayment);
    setNewPayment({ cardNumber: "", nameOnCard: "", expiry: "" });
    setShowPaymentModal(false);
  };

  // 🗑️ Delete
  const handleDeleteAddress = (id) =>
    deleteDoc(doc(db, "users", user.email, "addresses", id));
  const handleDeletePayment = (id) =>
    deleteDoc(doc(db, "users", user.email, "paymentMethods", id));

  // ✏️ Update Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const ref = doc(db, "users", user.email);
    await setDoc(ref, profileInfo, { merge: true });
    setShowProfileModal(false);
  };

  // 📸 Avatar Upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_URL, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setProfileInfo((s) => ({ ...s, avatarUrl: data.secure_url }));
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0].toUpperCase())
      .slice(0, 2)
      .join("");
  };

  const markAllAsRead = async () => {
    for (const n of notifications) {
      await updateDoc(doc(db, "users", user.email, "notifications", n.id), {
        read: true,
      });
    }
  };
  const clearAllNotifications = async () => {
    for (const n of notifications) {
      await deleteDoc(doc(db, "users", user.email, "notifications", n.id));
    }
  };

  // 🧑 Login / Signup
  const handleLogin = async (e) => {
    e.preventDefault();
    await login(form.email, form.password);
    setForm({ email: "", name: "", password: "" });
    setShowLoginModal(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    await signup(form.email, form.password, form.name);
    setForm({ email: "", name: "", password: "" });
    setShowLoginModal(false);
  };

  return (
    <>
      <Head>
        <title>Profile — Warea</title>
      </Head>

      <main className="page-container py-10">
        <h1 className="text-3xl font-bold mb-6 text-center">Your Profile</h1>

        {!user ? (
          <div className="text-center mt-10">
            <p className="text-gray-600 mb-4">You are not logged in.</p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Login / Sign Up
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* SIDEBAR */}
            <aside className="bg-white p-6 rounded-lg shadow space-y-6">
              <div className="flex flex-col items-center text-center">
                {profileInfo.avatarUrl ? (
                  <img
                    src={profileInfo.avatarUrl}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover mb-3"
                  />
                ) : (
                  <div className="w-20 h-20 flex items-center justify-center bg-gray-200 text-gray-800 rounded-full text-2xl font-bold mb-3">
                    {getInitials(profileInfo.name || user.name)}
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold">
                    {profileInfo.name || user.name}
                  </p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              <button
                onClick={() => setShowProfileModal(true)}
                className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                ✏️ Edit Profile
              </button>

              <nav className="space-y-2 text-sm font-medium">
                <button
                  onClick={() =>
                    document
                      .getElementById("orders-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100"
                >
                  📦 Orders
                </button>
                <Link
                  href="/wishlist"
                  className="block px-3 py-2 rounded hover:bg-gray-100"
                >
                  💖 Wishlist
                </Link>
                <button
                  onClick={() =>
                    document
                      .getElementById("payments-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="block w-full text-left px-3 py-2 rounded hover:bg-gray-100"
                >
                  💳 Payments
                </button>
              </nav>

              <button
                className="mt-4 w-full py-2 rounded bg-gray-900 text-white hover:bg-gray-700 transition"
                onClick={() => logout()}
              >
                Logout
              </button>
            </aside>

            {/* MAIN CONTENT */}
            <section className="md:col-span-2 space-y-6">
              {/* Payment, Orders, Notifications etc. remain same here */}
            </section>
          </div>
        )}
      </main>

      {/* ✨ LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative animate-fadeIn">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <div className="flex justify-center space-x-6 border-b pb-3 mb-4">
              <button
                onClick={() => setTab("login")}
                className={`pb-2 font-medium ${
                  tab === "login" ? "border-b-2 border-gray-900" : "text-gray-500"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setTab("signup")}
                className={`pb-2 font-medium ${
                  tab === "signup" ? "border-b-2 border-gray-900" : "text-gray-500"
                }`}
              >
                Sign Up
              </button>
            </div>

            {tab === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full border rounded px-3 py-2"
                />
                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-700 transition"
                >
                  Login
                </button>
              </form>
            )}

            {tab === "signup" && (
              <form onSubmit={handleSignup} className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  className="w-full border rounded px-3 py-2"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full border rounded px-3 py-2"
                />
                <button
                  type="submit"
                  className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-700 transition"
                >
                  Sign Up
                </button>
              </form>
            )}

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-2 text-gray-500 text-sm">or</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            {/* ✨ Premium Styled Google Login */}
            <button
              onClick={googleLogin}
              className="w-full flex justify-center items-center gap-3 py-2 rounded-lg bg-white shadow-sm border hover:shadow-md hover:scale-[1.02] transition-transform duration-150"
            >
              <img
                src="/google-icon.svg"
                alt="Google"
                className="w-5 h-5"
              />
              <span className="text-sm font-medium text-gray-700">
                Continue with Google
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

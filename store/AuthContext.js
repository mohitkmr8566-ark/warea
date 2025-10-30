// store/AuthContext.js
import { createContext, useContext, useEffect, useState } from "react";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import app from "@/lib/firebase";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const auth = getAuth(app);
  const [user, setUser] = useState(null); // raw Firebase user
  const [loading, setLoading] = useState(true);

  // 🔄 Watch authentication state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser || null);
      try {
        if (firebaseUser) {
          // Optional: keep a light profile in localStorage for UI hydration
          const profile = {
            email: firebaseUser.email || "",
            name: firebaseUser.displayName || "Customer",
          };
          localStorage.setItem("user", JSON.stringify(profile));
        } else {
          localStorage.removeItem("user");
        }
      } catch {}
      setLoading(false);
    });
    return () => unsub();
  }, [auth]);

  // 🟡 Return-to Redirect — if user logs in successfully
  useEffect(() => {
    if (user && typeof window !== "undefined") {
      const returnTo = localStorage.getItem("returnTo");
      if (returnTo) {
        localStorage.removeItem("returnTo");
        window.location.href = returnTo;
      }
    }
  }, [user]);

  // ✅ Helper: Get fresh ID token
  const getIdToken = async () => {
    try {
      if (!auth.currentUser) return null;
      return await auth.currentUser.getIdToken(true);
    } catch {
      return null;
    }
  };

  // ✅ Signup
  const signup = async (email, password, name) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      setUser(res.user);
      const profile = { email: res.user.email, name: name || "Customer" };
      localStorage.setItem("user", JSON.stringify(profile));
      toast.success("Account created ✅");
      return res.user;
    } catch (err) {
      toast.error(err.message);
      console.error(err);
      throw err;
    }
  };

  // ✅ Login
  const login = async (email, password) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      setUser(res.user);
      const profile = {
        email: res.user.email,
        name: res.user.displayName || "Customer",
      };
      localStorage.setItem("user", JSON.stringify(profile));
      toast.success("Logged in ✅");
      return res.user;
    } catch (err) {
      toast.error(err.message);
      console.error(err);
      throw err;
    }
  };

  // ✅ Google Login
  const googleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      setUser(res.user);
      const profile = {
        email: res.user.email,
        name: res.user.displayName || "Customer",
      };
      localStorage.setItem("user", JSON.stringify(profile));
      toast.success("Signed in with Google ✅");
      return res.user;
    } catch (err) {
      toast.error(err.message);
      console.error(err);
      throw err;
    }
  };

  // ✅ Logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, signup, googleLogin, getIdToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// store/AuthContext.js
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Listen for login/logout automatically
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ? firebaseUser : null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Email signup
  const signup = async (email, password) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      toast.success("Account created successfully 🎉");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // 🔹 Email login
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Logged in successfully ✅");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // 🔹 Google login
  const googleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Logged in with Google 🎯");
    } catch (error) {
      toast.error(error.message);
    }
  };

  // 🔹 Logout
  const logout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully 👋");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const value = { user, login, signup, googleLogin, logout, loading };
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

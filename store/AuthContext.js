// store/AuthContext.js
import { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Auth state change listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);

      if (firebaseUser) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            email: firebaseUser.email,
            name: firebaseUser.displayName || "Customer",
          })
        );
      } else {
        localStorage.removeItem("user");
      }

      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ✅ Restore return-to navigation after login
  useEffect(() => {
    if (user && typeof window !== "undefined") {
      const returnTo = localStorage.getItem("returnTo");
      if (returnTo) {
        localStorage.removeItem("returnTo");
        window.location.href = returnTo;
      }
    }
  }, [user]);

  // ✅ Login
  const login = async (email, password) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      setUser(res.user);
      toast.success("Logged in ✅");
      return res.user;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  // ✅ Signup
  const signup = async (email, password, name) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      setUser(res.user);
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: res.user.email,
          name: name || "Customer",
        })
      );
      toast.success("Account created ✅");
      return res.user;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  // ✅ Google Login
  const googleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      setUser(res.user);
      toast.success("Signed in with Google ✅");
      return res.user;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  // ✅ Logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem("user");
    toast.success("Logged out");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

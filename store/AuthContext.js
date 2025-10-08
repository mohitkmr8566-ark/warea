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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ Added loading flag

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          email: firebaseUser.email,
          name: firebaseUser.displayName || "Customer",
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }
      setLoading(false); // ✅ done initializing auth
    });

    return () => unsubscribe();
  }, [auth]);

  // ✅ Email-password signup
  const signup = async (email, password, name) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const userData = {
        email: res.user.email,
        name: name || "Customer",
      };
      setUser(userData);
      toast.success("Account created ✅");
      return userData;
    } catch (err) {
      toast.error(err.message);
      console.error(err);
    }
  };

  // ✅ Email-password login
  const login = async (email, password) => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const userData = {
        email: res.user.email,
        name: res.user.displayName || "Customer",
      };
      setUser(userData);
      toast.success("Logged in ✅");
      return userData;
    } catch (err) {
      toast.error(err.message);
      console.error(err);
    }
  };

  // ✅ Google login
  const googleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const userData = {
        email: res.user.email,
        name: res.user.displayName || "Customer",
      };
      setUser(userData);
      toast.success("Signed in with Google ✅");
      return userData;
    } catch (err) {
      toast.error(err.message);
      console.error(err);
    }
  };

  // ✅ Logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
  };

  // ✅ Provide everything, including `loading`
  return (
    <AuthContext.Provider
      value={{ user, login, logout, signup, googleLogin, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

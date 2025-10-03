// store/AuthContext.js
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) setUser(JSON.parse(s));
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  const login = ({ email, name }) => {
    // placeholder: a real backend would return token + user data
    const u = { email, name: name || "Customer" };
    setUser(u);
    return u;
  };

  const logout = () => setUser(null);

  const signup = ({ email, name }) => {
    // placeholder: treat same as login for now
    const u = { email, name: name || "Customer" };
    setUser(u);
    return u;
  };

  return <AuthContext.Provider value={{ user, login, logout, signup }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

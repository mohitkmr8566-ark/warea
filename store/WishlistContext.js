// store/WishlistContext.js
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);

  // Load from localStorage once
  useEffect(() => {
    try {
      const s = localStorage.getItem("wishlist");
      if (s) setWishlist(JSON.parse(s));
    } catch {}
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem("wishlist", JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  // Check if product exists
  const inWishlist = useCallback(
    (id) => wishlist.some((p) => p.id === id),
    [wishlist]
  );

  // Add or Remove
  const toggleItem = useCallback((product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      return exists ? prev.filter((p) => p.id !== product.id) : [...prev, product];
    });
  }, []);

  // Clear wishlist
  const clearWishlist = useCallback(() => setWishlist([]), []);

  // ✅ Memoized value
  const value = useMemo(
    () => ({ wishlist, inWishlist, toggleItem, clearWishlist }),
    [wishlist, inWishlist, toggleItem, clearWishlist]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);

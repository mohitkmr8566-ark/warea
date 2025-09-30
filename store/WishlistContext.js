import { createContext, useContext, useEffect, useState, useCallback } from "react";

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);

  // Load from localStorage once
  useEffect(() => {
    const s = localStorage.getItem("wishlist");
    if (s) setWishlist(JSON.parse(s));
  }, []);

  // Persist on change
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  // ✅ Helper: Check if product is already in wishlist
  const inWishlist = useCallback(
    (id) => wishlist.some((p) => p.id === id),
    [wishlist]
  );

  // ✅ Add/Remove Toggle
  const toggleItem = useCallback(
    (product) => {
      setWishlist((prev) => {
        const exists = prev.some((p) => p.id === product.id);
        if (exists) {
          return prev.filter((p) => p.id !== product.id);
        }
        return [...prev, product];
      });
    },
    []
  );

  const clearWishlist = () => setWishlist([]);

  return (
    <WishlistContext.Provider
      value={{ wishlist, inWishlist, toggleItem, clearWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);

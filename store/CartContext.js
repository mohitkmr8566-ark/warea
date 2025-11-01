// store/CartContext.js
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
} from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // Load from localStorage once
  useEffect(() => {
    try {
      const s = localStorage.getItem("cart");
      if (s) setItems(JSON.parse(s));
    } catch {}
  }, []);

  // Persist on change
  useEffect(() => {
    try {
      localStorage.setItem("cart", JSON.stringify(items));
    } catch {}
  }, [items]);

  // ✅ Stable function to add item
  const addItem = useCallback((product, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((p) => p.id === product.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: (next[i].qty || 1) + qty };
        return next;
      }
      return [...prev, { ...product, qty }];
    });
  }, []);

  // ✅ Stable remove
  const removeItem = useCallback(
    (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
    []
  );

  // ✅ Stable update qty
  const updateQuantity = useCallback((id, qty) => {
    setItems((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, qty: Math.max(1, Number(qty) || 1) } : p
      )
    );
  }, []);

  // ✅ Stable clear cart
  const clearCart = useCallback(() => setItems([]), []);

  // ✅ Memoized subtotal
  const subtotal = useMemo(
    () =>
      items.reduce((s, p) => s + (Number(p.price) || 0) * (p.qty || 1), 0),
    [items]
  );

  // ✅ Memoized context value → prevents re-renders globally
  const value = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, clearCart, subtotal }),
    [items, addItem, removeItem, updateQuantity, clearCart, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);

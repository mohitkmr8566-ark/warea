import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // load once
  useEffect(() => {
    const s = localStorage.getItem("cart");
    if (s) setItems(JSON.parse(s));
  }, []);

  // persist
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addItem = (product, qty = 1) => {
    setItems(prev => {
      const i = prev.findIndex(p => p.id === product.id);
      if (i > -1) {
        const next = [...prev];
        next[i] = { ...next[i], qty: (next[i].qty || 1) + qty };
        return next;
      }
      return [...prev, { ...product, qty }];
    });
  };

  const removeItem = id => setItems(prev => prev.filter(p => p.id !== id));
  const updateQuantity = (id, qty) =>
    setItems(prev =>
      prev.map(p => (p.id === id ? { ...p, qty: Math.max(1, Number(qty) || 1) } : p))
    );
  const clearCart = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((s, p) => s + (p.price || 0) * (p.qty || 1), 0),
    [items]
  );

  const value = { items, addItem, removeItem, updateQuantity, clearCart, subtotal };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);

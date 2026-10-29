import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('carbook_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('carbook_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [items]);

  const addToCart = (tyre, quantity = 1) => {
    if (!tyre || !tyre._id) return;
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.tyre._id === tyre._id);
      const maxStock = typeof tyre.stockQuantity === 'number' ? tyre.stockQuantity : 999;
      
      if (existingIndex > -1) {
        const currentQty = prevItems[existingIndex].quantity;
        const newQty = Math.min(currentQty + quantity, maxStock);
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          tyre, // refresh latest snapshot
        };
        return updated;
      } else {
        const initialQty = Math.min(quantity, maxStock);
        return [...prevItems, { tyre, quantity: Math.max(1, initialQty) }];
      }
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (tyreId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(tyreId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.tyre._id === tyreId) {
          const maxStock = typeof item.tyre.stockQuantity === 'number' ? item.tyre.stockQuantity : 999;
          return { ...item, quantity: Math.min(newQuantity, maxStock) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (tyreId) => {
    setItems((prevItems) => prevItems.filter((item) => item.tyre._id !== tyreId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = items.reduce((sum, item) => sum + (item.tyre.price || 0) * item.quantity, 0);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen((prev) => !prev);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}

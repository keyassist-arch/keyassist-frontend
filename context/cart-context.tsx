"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { CartItem, Product, ProductVariant } from "@/types";

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, quantity: number, variant?: ProductVariant) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  drawerOpen: boolean;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const addItem = (product: Product, quantity: number, variant?: ProductVariant) => {
    setItems((prev) => {
      const key = `${product.id}-${variant?.id ?? "default"}`;
      const existing = prev.find((i) => i.id === key);

      if (existing) {
        return prev.map((i) =>
          i.id === key ? { ...i, quantity: i.quantity + quantity } : i
        );
      }

      return [
        ...prev,
        {
          id: key,
          productId: product.id,
          title: product.title,
          price: product.price,
          currency: product.currency,
          image: product.images[0] ?? "/product-placeholder.svg",
          quantity,
          variant,
          marketplace: product.marketplace,
        },
      ];
    });
  };

  const removeItem = (itemId: string) =>
    setItems((prev) => prev.filter((item) => item.id !== itemId));

  const updateQuantity = (itemId: string, quantity: number) =>
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: Math.max(1, quantity) } : item))
    );

  const clearCart = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const openCartDrawer = () => setDrawerOpen(true);
  const closeCartDrawer = () => setDrawerOpen(false);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        subtotal,
        drawerOpen,
        openCartDrawer,
        closeCartDrawer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }
  return context;
}

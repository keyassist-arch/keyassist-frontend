"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import type { CartItem, Product, ProductVariant } from "@/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  cartAddItem,
  cartClear,
  cartCloseDrawer,
  cartOpenDrawer,
  cartRemoveItem,
  cartUpdateQuantity,
  rehydrateCartFromStorage,
} from "@/store/slices/cartSlice";

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
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items) as CartItem[];
  const drawerOpen = useAppSelector((s) => s.cart.drawerOpen);

  useEffect(() => {
    dispatch(rehydrateCartFromStorage());
  }, [dispatch]);

  const addItem = (product: Product, quantity: number, variant?: ProductVariant) => {
    dispatch(cartAddItem({ product, quantity, variant }));
  };

  const removeItem = (itemId: string) => dispatch(cartRemoveItem(itemId));
  const updateQuantity = (itemId: string, quantity: number) => dispatch(cartUpdateQuantity({ itemId, quantity }));
  const clearCart = () => dispatch(cartClear());

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  const openCartDrawer = () => dispatch(cartOpenDrawer());
  const closeCartDrawer = () => dispatch(cartCloseDrawer());

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

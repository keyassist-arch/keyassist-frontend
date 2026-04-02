"use client";

import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/context/cart-context";
import { StoreProvider } from "@/components/providers/store-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <CartProvider>
        {children}
        <CartDrawer />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4500,
            style: {
              background: "var(--shop-white)",
              color: "var(--shop-ink)",
              border: "1px solid var(--shop-border)",
              borderRadius: 0,
              fontSize: "0.875rem",
              boxShadow: "0 8px 24px rgba(26, 26, 26, 0.08)",
            },
            success: {
              iconTheme: {
                primary: "var(--shop-accent)",
                secondary: "var(--shop-white)",
              },
            },
            error: {
              iconTheme: {
                primary: "var(--shop-sale)",
                secondary: "var(--shop-white)",
              },
            },
          }}
        />
      </CartProvider>
    </StoreProvider>
  );
}

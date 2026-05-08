import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { CartItem, Product, ProductVariant } from "@/types";

const STORAGE_KEY = "uc_cart_v1";

export interface CartState {
  items: CartItem[];
  drawerOpen: boolean;
}

const emptyState: CartState = {
  items: [],
  drawerOpen: false,
};

function readPersisted(): CartState {
  if (typeof window === "undefined") return { ...emptyState };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...emptyState };
    const parsed = JSON.parse(raw) as Partial<CartState>;
    return {
      ...emptyState,
      ...parsed,
      // never persist drawer open across reloads
      drawerOpen: false,
      items: Array.isArray(parsed.items) ? (parsed.items as CartItem[]) : [],
    };
  } catch {
    return { ...emptyState };
  }
}

function persist(state: CartState) {
  if (typeof window === "undefined") return;
  try {
    if (!state.items.length) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: state.items }));
  } catch {
    /* ignore */
  }
}

export const cartSlice = createSlice({
  name: "cart",
  initialState: emptyState,
  reducers: {
    rehydrateFromStorage: () => readPersisted(),
    addItem: (state, action: PayloadAction<{ product: Product; quantity: number; variant?: ProductVariant }>) => {
      const { product, quantity, variant } = action.payload;
      const key = `${product.id}-${variant?.id ?? "default"}`;
      const existing = state.items.find((i) => i.id === key);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({
          id: key,
          productId: product.id,
          title: product.title,
          price: product.price,
          currency: product.currency,
          image: product.images[0] ?? "/product-placeholder.svg",
          quantity,
          variant,
          marketplace: product.marketplace,
        });
      }
      persist(state);
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.id !== action.payload);
      persist(state);
    },
    updateQuantity: (state, action: PayloadAction<{ itemId: string; quantity: number }>) => {
      const item = state.items.find((i) => i.id === action.payload.itemId);
      if (!item) return;
      item.quantity = Math.max(1, action.payload.quantity);
      persist(state);
    },
    clearCart: (state) => {
      state.items = [];
      persist(state);
    },
    openDrawer: (state) => {
      state.drawerOpen = true;
    },
    closeDrawer: (state) => {
      state.drawerOpen = false;
    },
  },
});

export const {
  rehydrateFromStorage: rehydrateCartFromStorage,
  addItem: cartAddItem,
  removeItem: cartRemoveItem,
  updateQuantity: cartUpdateQuantity,
  clearCart: cartClear,
  openDrawer: cartOpenDrawer,
  closeDrawer: cartCloseDrawer,
} = cartSlice.actions;

export default cartSlice.reducer;


export type Role = "user" | "admin";

import type { ProductAttribute } from "./product-detail";

export type Marketplace =
  | "Amazon"
  | "Apple"
  | "Nike"
  | "Shopify Partner"
  | "Partner"
  | "GOAT"
  | "Zara"
  | "Converse"
  | "eBay"
  | "StockX"
  | "Etsy"
  | "Reebelo"
  | "Walmart"
  | "Back Market"
  | "Key Assist";

export interface ProductVariant {
  id: string;
  name: string;
  value: string;
}

export interface Product {
  id: string;
  /** From API; prefer for `/products/...` links when present. */
  slug?: string | null;
  marketplace: Marketplace;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  variants: ProductVariant[];
  category: string;
  collection: string;
  seller: string;
  stock: number;
  deliveryEstimate: string;
  trending?: boolean;
  popular?: boolean;
  /** Storefront grid: NEW / SALE ribbon */
  badge?: "new" | "sale";
  /** 1–5 for product grid display */
  rating?: number;
  /** List price when on sale (for strikethrough + % off). */
  compareAtPrice?: number;
  /** Integer percent off when compareAtPrice > shelf price. */
  discountPercent?: number;
  /** Optional PDP zones (same semantics as API product). */
  highlights?: string[];
  attributes?: ProductAttribute[];
  compliance?: string[];
  whatsInTheBox?: string[];
}

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  currency: string;
  image: string;
  quantity: number;
  variant?: ProductVariant;
  marketplace: Marketplace;
}

export interface Order {
  id: string;
  createdAt: string;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  items: CartItem[];
  total: number;
  currency: string;
  trackingId?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  savedPaymentMethod: string;
}


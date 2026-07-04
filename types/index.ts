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
  | "Back Market";

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

// ── Wanna Buy List ───────────────────────────────────────────────────────────

export type WannaBuyItemStatus =
  | "pending"
  | "quoted"
  | "confirmed"
  | "paid"
  | "ordered"
  | "cancelled"
  | "expired";

export type BatchStatus =
  | "collecting"
  | "processing"
  | "placing_orders"
  | "in_transit"
  | "at_warehouse"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface WannaBuyItem {
  id: string;
  userId: string;
  batchId: string | null;
  productUrl: string;
  productTitle: string | null;
  imageUrl: string | null;
  marketplace: string | null;
  variantSelection: Record<string, string> | null;
  status: WannaBuyItemStatus;
  scrapedPriceUsd: string | null;
  adminPriceUsd: string | null;
  priceEditNote: string | null;
  taxAmountUsd: string | null;
  platformFeeUsd: string | null;
  kingzShippingUsd: string | null;
  fxBufferUsd: string | null;
  totalUsd: string | null;
  totalNgn: string | null;
  notifiedAt: string | null;
  confirmedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id: string;
  status: BatchStatus;
  label: string | null;
  processingStartedAt: string | null;
  placingOrdersAt: string | null;
  inTransitAt: string | null;
  atWarehouseAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  items?: WannaBuyItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AddWannaBuyItemRequest {
  productUrl: string;
  variantSelection?: Record<string, string>;
}

export interface AdminQuoteRequest {
  adminPriceUsd?: number;
  priceEditNote?: string;
  taxAmountUsd?: number;
  kingzShippingUsd?: number;
  notifyUser?: boolean;
}

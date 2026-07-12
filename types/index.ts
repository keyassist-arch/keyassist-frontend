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
  reminderSentAt: string | null;
  confirmedAt: string | null;
  paidAt: string | null;
  /** True while the current quote is a fast, price-only estimate rather than the admin's final tax+shipping quote. */
  isEstimateQuote: boolean;
  /** Snapshot of `totalUsd` at the moment this was paid — the baseline a finalized quote is refunded against. */
  chargedTotalUsd: string | null;
  /** When a previously-estimated quote was reconciled to its final total. */
  quoteFinalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id: string;
  status: BatchStatus;
  label: string | null;
  /** When this batch stops accepting new items. `null` = no cutoff (legacy batches). */
  collectingEndsAt: string | null;
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
  /** Pass when the item was picked from an existing catalog product — skips the backend scrape. */
  productTitle?: string;
  imageUrl?: string;
}

/** Carried on the `POST /wanna-buy` response when the item landed in a new batch because the previous one closed. */
export interface BatchRolloverInfo {
  previousBatchLabel: string;
  newBatchLabel: string;
  collectingEndsAt: string | null;
}

export interface AddWannaBuyItemResponse extends WannaBuyItem {
  batchRollover: BatchRolloverInfo | null;
}

export interface PayWannaBuyItemsRequest {
  itemIds: string[];
}

/** Only meaningful on Processing → Placing Orders — confirms moving unpaid items to the next batch. */
export interface AdminBatchStatusRequest {
  status: BatchStatus;
  resolveUnpaid?: "reassign";
}

export interface UnpaidWannaBuyItemSummary {
  id: string;
  productTitle: string;
  userId: string;
}

/** Shape of the 409 response body when Processing → Placing Orders is blocked by unpaid items. */
export interface UnpaidItemsConflict {
  message: string;
  unpaidCount: number;
  unpaidItems: UnpaidWannaBuyItemSummary[];
}

export interface AdminQuoteRequest {
  adminPriceUsd?: number;
  priceEditNote?: string;
  taxAmountUsd?: number;
  kingzShippingUsd?: number;
  notifyUser?: boolean;
  /** Items added by URL no longer arrive with a scraped title/image — admin fills these in while quoting. */
  productTitle?: string;
  imageUrl?: string;
  /**
   * True for a fast, price-only quote so the customer can pay upfront; false/omitted for the
   * final tax+shipping-inclusive quote. Finalizing a previously-estimated, already-paid item
   * auto-refunds the difference if the final total comes in lower.
   */
  isEstimateQuote?: boolean;
}

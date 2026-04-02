/** NestJS unified-commerce API shapes (see integration guide). */

import type { ProductAttribute } from "./product-detail";

export type JwtRole = "USER" | "ADMIN_SUPER" | "ADMIN_STAFF";

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

/** `POST /auth/register` — no tokens until `POST /auth/verify-email`. */
export interface RegisterResponse {
  requiresEmailVerification: boolean;
  email: string;
  message: string;
}

/** Lines for `localCart` on login / verify-email and `items` on `POST /cart/sync` (max 100). */
export interface LocalCartLine {
  productId: string;
  quantity: number;
  variantSelection?: Record<string, string>;
}

export interface LoginRequest {
  email: string;
  password: string;
  localCart?: LocalCartLine[];
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

/** `POST /auth/forgot-password` — always this shape; do not infer whether the email exists. */
export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface VerifyEmailRequest {
  token: string;
  localCart?: LocalCartLine[];
}

/** `POST /auth/verify-email` success — same as login; optional `cart` when `localCart` was non-empty. */
export type VerifyEmailResponse = TokenResponse & {
  cart?: CartResponse;
};

export interface ResendVerificationRequest {
  email: string;
}

/** `POST /auth/resend-verification` — do not infer whether the email exists. */
export interface ResendVerificationResponse {
  message: string;
}

export interface CartSyncRequest {
  items: LocalCartLine[];
}

export interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  phone?: string;
}

export interface MeResponse {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role: JwtRole;
  /** Present after login / verify-email; use for settings UI. */
  emailVerified?: boolean;
  defaultShippingAddress?: ShippingAddress | null;
}

export interface PatchMeRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  defaultShippingAddress?: ShippingAddress;
}

/** Public catalog / PDP `source` field (lowercase enum from API). */
export type ProductSource = "jumia" | "amazon" | "nike" | "apple" | "generic";

/** One variant dimension; `variantSelection` keys must match `name`. */
export interface ApiProductVariantDimension {
  name: string;
  options: string[];
}

/**
 * Per-configuration prices when the scraper provides them (e.g. Apple metrics SKUs).
 * Distinct from top-level `originalPrice` / `salePrice` on the listing; there is no separate `compareAtPrice` field on the product JSON.
 */
export interface ApiConfigurationPrice {
  label: string;
  originalPrice?: string | number;
  salePrice?: string | number;
  partNumber?: string;
  sku?: string;
}

/**
 * Product row from `GET /products` and `GET /products/:idOrSlug` (same shape).
 * Fetch by UUID or by readable `slug`. Monetary fields are decimal strings; `variants` is dimension pickers.
 * `description` is assembled from scraper output (e.g. Apple JSON-LD, configuration lines; Amazon may append list-price sentences).
 */
export interface ApiProduct {
  id: string;
  /** Human-readable path segment; use in storefront URLs when set. */
  slug?: string | null;
  title: string;
  description?: string | null;
  brand?: string | null;
  source?: ProductSource | string;
  sourceUrl?: string;
  /** Same as `sourceUrl`; scrape / rescrape target. */
  scrapeUrl?: string;
  rescrapeEnabled?: boolean;
  /** Supplier / list price from last scrape (decimal string). */
  originalPrice?: string | number;
  /** Customer-facing price including platform markup (decimal string). */
  salePrice?: string | number;
  /** Platform margin, e.g. `"10.00"` (often admin-only). */
  markupPercent?: string | number;
  currency?: string;
  images?: string[];
  variants?: ApiProductVariantDimension[] | unknown;
  availability?: string | null;
  /** `null` = unlimited / not tracked (dropship). */
  stockQuantity?: number | string | null;
  lastScrapedAt?: string | null;
  lastVerifiedAt?: string | null;
  /** Per-configuration price rows when the scraper provides them (e.g. Apple). */
  configurationPrices?: ApiConfigurationPrice[];
  /** Optional structured PDP fields. */
  highlights?: string[];
  attributes?: ProductAttribute[];
  compliance?: string[];
  whatsInTheBox?: string[];
}

export type ImportJobStatus = "queued" | "processing" | "completed" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface TypicalWaitSecondsHint {
  min?: number;
  max?: number;
}

/** POST /products/import, GET /products/import/:id, and Socket.IO `import.updated`. */
export interface ProductImportResponse {
  status?: ImportJobStatus | string;
  importId?: string;
  product?: ApiProduct;
  /** User-facing copy while QUEUED / PROCESSING. */
  userMessage?: string;
  phase?: "queued" | "scraping" | string;
  /** Suggested delay before the next GET poll (ms). */
  pollAfterMs?: number | string;
  typicalWaitSeconds?: TypicalWaitSecondsHint;
  errorMessage?: string;
  /** User-safe failure text on FAILED (preferred over raw errorMessage). */
  message?: string;
}

/** Debug-only; does not write to catalog. */
export interface ScrapePreviewResponse {
  url?: string;
  detectedSource?: string;
  scraped?: unknown;
}

export interface CartItemResponse {
  id: string;
  quantity: number;
  variantSelection?: Record<string, string>;
  product: ApiProduct | { id: string };
}

export interface CartResponse {
  id: string;
  items: CartItemResponse[];
}

export interface AddCartItemRequest {
  productId: string;
  quantity: number;
  variantSelection?: Record<string, string>;
}

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "PROCESSING"
  | "ORDERED_FROM_SUPPLIER"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItemSnapshot {
  title: string;
  price: number;
  currency: string;
  quantity: number;
  images?: string[];
  variant?: unknown;
}

export interface OrderResponse {
  id: string;
  status: OrderStatus;
  items: OrderItemSnapshot[];
  payment?: {
    provider?: string;
    methodDetails?: unknown;
    paystackReference?: string;
    stripeCheckoutSessionId?: string;
    stripePaymentIntentId?: string;
  };
  tracking?: unknown[];
  userEmail?: string;
}

export interface CreateOrderRequest {
  shippingAddress?: ShippingAddress;
}

export type PaymentProvider = "paystack" | "stripe";

export interface InitializePaymentRequest {
  orderId: string;
  provider: PaymentProvider;
  paystackChannels?: string[];
  stripePaymentMethodTypes?: string[];
  stripeSuccessUrl?: string;
  stripeCancelUrl?: string;
}

export type PaymentInitResponse =
  | {
      provider: "paystack";
      authorizationUrl: string;
      accessCode: string;
      reference: string;
      channels?: string[];
    }
  | {
      provider: "stripe";
      sessionId: string;
      url: string;
      paymentMethodTypes?: string[];
    };

export interface PatchAdminOrderRequest {
  status?: OrderStatus | string;
  supplierOrderId?: string;
  trackingNumber?: string;
  carrier?: string;
  trackingStatus?: string;
}

export interface NestValidationError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

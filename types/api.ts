/** NestJS unified-commerce API shapes (see integration guide). */

import type { ProductAttribute } from "./product-detail";

export type JwtRole = "USER" | "ADMIN_SUPER" | "ADMIN_STAFF";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  position: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedApiProducts {
  total: number;
  page: number;
  limit: number;
  results: ApiProduct[];
}

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

/** `POST /auth/login/2fa` — complete sign-in after password step returned `requiresTwoFactor`. */
export interface Login2faRequest {
  preAuthToken: string;
  code: string;
  localCart?: LocalCartLine[];
}

/** First login step when TOTP is enabled — do not store as session until TOTP succeeds. */
export interface TwoFactorPreAuthResponse {
  requiresTwoFactor: true;
  errorCode?: "TWO_FACTOR_REQUIRED";
  preAuthToken: string;
  expiresIn: string;
}

/** `POST /auth/login` returns either JWTs or a 2FA challenge. */
export type LoginResult =
  | (TokenResponse & { cart?: CartResponse })
  | TwoFactorPreAuthResponse;

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
  twoFactor?: {
    enabled: boolean;
    setupPending: boolean;
  };
  defaultShippingAddress?: ShippingAddress | null;
}

export interface PatchMeRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  defaultShippingAddress?: ShippingAddress;
}

/** `GET /me/2fa` */
export interface Me2faStatusResponse {
  enabled: boolean;
  setupPending: boolean;
}

/** `POST /me/2fa/setup` */
export interface Me2faSetupResponse {
  qrCodeDataUrl: string;
  otpauthUrl: string;
  secret: string;
  issuer: string;
}

export interface Me2faEnableRequest {
  code: string;
}

export interface Me2faDisableRequest {
  password: string;
  code: string;
}

/** Public catalog / PDP `source` field (lowercase enum from API; more values may appear at runtime). */
export type ProductSource =
  | "jumia"
  | "amazon"
  | "nike"
  | "apple"
  | "generic"
  | "goat"
  | "zara"
  | "converse"
  | "ebay"
  | "stockx";

/** One variant dimension; `variantSelection` keys must match `name`. */
export interface ApiProductVariantDimension {
  name: string;
  options: string[];
}

/**
 * Per-configuration prices when the scraper provides them (Apple, GOAT, Zara, etc.).
 * Match rows to `variants` via `variantAxis` + `optionValue` when building cart `variantSelection`.
 * See integration guide: store-agnostic product details → configurationPrices.
 */
export interface ApiConfigurationPrice {
  /** Fallback label when `displayLabel` is absent. */
  label?: string;
  originalPrice?: string | number;
  salePrice?: string | number;
  partNumber?: string;
  sku?: string;
  /** Matches a `variants[].name` axis when the API tags rows (e.g. Size, Color). */
  variantAxis?: string;
  /** Matches the chosen option on that axis. */
  optionValue?: string;
  /** Multi-axis selection map (e.g. Apple Storage×Color, Nike Width×Size). */
  variantSelections?: Record<string, string>;
  /** Row-level currency when it differs from product `currency`. */
  currency?: string;
  /** When false, treat line as out of stock for that configuration. */
  available?: boolean;
  /** Preferred human-readable cell label (e.g. "10 — from USD 425.00"). */
  displayLabel?: string;
  /** Opaque store-specific hints (e.g. GOAT `sizeValue`, StockX `priceNeedsLookup`). */
  metadata?: Record<string, unknown>;
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
  /** Crossed-out "was" / list price. Present on Amazon, eBay, Zara, Nike sale items. */
  compareAtPrice?: string | null;
  /** Raw savings badge text from the PDP, e.g. `"-40%"` or `"60% off"`. Amazon, eBay, Nike. */
  discount?: string | null;
  /** Absolute saving as decimal string, e.g. `"1020.00"`. Amazon, eBay only. */
  savingsAmount?: string | null;
  /** Promotional banner label, e.g. `"Limited-time deal"`. Amazon only. */
  dealType?: string | null;
  /** Adapter-specific extra data (Apple `carrierLinkMap`, StockX `styleId`/`priceSource`, etc.). */
  metadata?: Record<string, unknown> | null;
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
  /** True when the URL is from an unsupported retailer — navigate user to the manual entry form. */
  requiresManualEntry?: boolean;
  /** Normalized source URL echoed back when requiresManualEntry is true. */
  sourceUrl?: string;
}

export interface ManualProductImportRequest {
  title: string;
  price: number;
  currency: string;
  brand?: string;
  description?: string;
  imageUrls?: string[];
  sourceUrl: string;
}

export interface ManualProductImportResponse {
  status: "completed";
  product: ApiProduct;
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
  subtotal?: string | number;
  serviceCharge?: string | number;
  discount?: string | number;
  fees?: string | number;
  total?: string | number;
  currency?: string;
}

/** @deprecated use `LoginResult` — response may be tokens or 2FA pre-auth. */
export type LoginResponse = TokenResponse & {
  cart?: CartResponse;
};

/** `POST /auth/verify-email` success — same as login; optional `cart` when `localCart` was non-empty. */
export type VerifyEmailResponse = TokenResponse & {
  cart?: CartResponse;
};

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
  | "CANCELLED"
  | "REFUNDED"
  | "DISPUTED";

export interface OrderItemSnapshot {
  title: string;
  price: number;
  currency: string;
  quantity: number;
  images?: string[];
  variant?: unknown;
}

/** Machine-readable checkout hint on every `GET /orders/:id` response. */
export interface OrderCheckoutHint {
  /** True when the user may call `POST /payments/initialize` (same as unpaid / `status === "PENDING"` in normal flows). */
  canInitializePayment: boolean;
  /** `initialize_payment` while payment is still required; `none` otherwise. */
  nextStep: "initialize_payment" | "none" | string;
}

/**
 * Pre-computed 3-line order summary from `GET /orders/:id`.
 * Use this for the main order summary UI — do not compute totals from individual fields.
 * `importAndDelivery` bundles marketplace tax, domestic/international shipping, customs, FX and risk buffers.
 */
export interface OrderDisplaySummary {
  /** Product price × quantity total. */
  product: string;
  /** All import and delivery costs combined (shipping, customs, buffers). */
  importAndDelivery: string;
  /** Service charge (10% of product subtotal). */
  serviceFee: string;
  /** Loyalty discount (20% when subtotal > $1000, else "0.00"). */
  discount: string;
  /** Grand total. */
  total: string;
  currency: string;
}

export interface OrderResponse {
  id: string;
  status: OrderStatus;
  items: OrderItemSnapshot[];
  /** Next checkout action; present on `GET /orders/:id` (and related order payloads). */
  checkout?: OrderCheckoutHint;
  /**
   * Pre-computed 3-line summary — use this for the main order summary UI.
   * Do not recompute totals from individual fields; use `pricingBreakdown` for the details drawer.
   */
  displaySummary?: OrderDisplaySummary;
  /** Present on `GET /orders/:id` for checkout / order detail UIs. */
  shippingAddress?: ShippingAddress | null;
  subtotal?: string | number;
  serviceCharge?: string | number;
  discount?: string | number;
  fees?: string | number;
  /** Kingz international shipping fee (warehouse → customer). */
  shippingFee?: string | number;
  /** Estimated marketplace tax. */
  marketplaceTax?: string | number;
  /** Estimated marketplace → warehouse shipping. */
  marketplaceShipping?: string | number;
  /** Warehouse receiving and processing fee. */
  domesticHandling?: string | number;
  /** Nigeria import duty + VAT + customs clearing fee combined. */
  customsTotal?: string | number;
  /** 2.5% exchange-rate buffer. */
  fxBuffer?: string | number;
  /** 6% operational risk buffer. */
  riskBuffer?: string | number;
  total?: string | number;
  currency?: string;
  /** Human-readable cost breakdown lines (same as `POST /landed-cost/quote`'s `breakdown`). */
  pricingBreakdown?: string[];
  payment?: {
    provider?: string;
    methodDetails?: {
      checkoutId?: string;
      checkoutProvider?: string;
      [key: string]: unknown;
    };
    paystackReference?: string;
    stripeCheckoutSessionId?: string;
    stripePaymentIntentId?: string;
  };
  tracking?: TrackingEntry[];
  userEmail?: string;
}

/** `GET /orders/pending-payment` — most recent unpaid order for banners / resume checkout. */
export interface PendingPaymentResponse {
  order: OrderResponse | null;
}

/** Socket.IO `order.updated` event payload. */
export interface OrderUpdatedEvent {
  orderId: string;
  status: OrderStatus | string;
}

export interface LandedCostInput {
  destination: LandedCostDestination;
  shippingService: LandedCostService;
  category?: LandedCostCategory;
}

export interface CreateOrderRequest {
  shippingAddress?: ShippingAddress;
  /** Required. Use the same destination/shippingService/category shown in `POST /landed-cost/quote`. */
  landedCost: LandedCostInput;
}

export type PaymentProvider = "paystack" | "stripe" | "paypal" | "myaza";

export type PaymentMethodReason = "not_configured" | "temporarily_disabled" | string | null;

export interface PaymentMethodEntry {
  provider: PaymentProvider;
  available: boolean;
  reason: PaymentMethodReason;
}

export interface PaymentMethodsResponse {
  methods: PaymentMethodEntry[];
  updatedAt?: string;
}

export interface InitializePaymentRequest {
  orderId: string;
  provider: PaymentProvider;
  paystackChannels?: string[];
  stripePaymentMethodTypes?: string[];
  stripeSuccessUrl?: string;
  stripeCancelUrl?: string;
  paypalReturnUrl?: string;
  paypalCancelUrl?: string;
  myazaReturnUrl?: string;
  myazaCancelUrl?: string;
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
    }
  | {
      provider: "paypal";
      paypalOrderId: string;
      approvalUrl: string;
    }
  | {
      provider: "myaza";
      paymentId: string;
      sessionId: string;
      checkoutUrl: string;
      depositAddress: string;
      qrCode: string;
      chain: string;
      token: string;
      amount: string;
      status: string;
      expiresAt?: string;
    };

export interface PaypalCaptureRequest {
  orderId: string;
  paypalOrderId: string;
}

export interface PatchAdminOrderRequest {
  status?: OrderStatus | string;
  supplierOrderId?: string;
  trackingNumber?: string;
  carrier?: string;
  trackingStatus?: string;
  /** Human-readable note shown to the customer on the tracking event (max 512 chars). */
  trackingMessage?: string;
}

/** Append-only tracking event from `GET /orders/:id` → `tracking[]`. */
export interface TrackingEntry {
  id: string;
  carrier?: string | null;
  trackingNumber?: string | null;
  /** Lifecycle label: UPDATED | IN_TRANSIT | OUT_FOR_DELIVERY | DELIVERED | EXCEPTION */
  status?: string;
  message?: string | null;
  createdAt: string;
}

// ─── Reconciliation (admin only) ─────────────────────────────────────────────

export type RefundStatus = "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "MANUAL_REQUIRED";

export interface ReconciliationRefund {
  id: string;
  orderId: string;
  amount: string;
  reason?: string | null;
  internalNote?: string | null;
  initiatedBy?: string | null;
  status: RefundStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRefundRequest {
  orderId: string;
  amount: string;
  reason?: string;
  internalNote?: string;
  initiatedBy?: string;
}

export type IssueType =
  | "PAYMENT_DISPUTE"
  | "REFUND_REQUEST"
  | "ITEM_NOT_RECEIVED"
  | "WRONG_ITEM"
  | "DAMAGED_ITEM"
  | "BILLING_ERROR"
  | "OTHER";

export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type IssueStatus = "OPEN" | "IN_PROGRESS" | "AWAITING_CUSTOMER" | "RESOLVED" | "CLOSED";

export interface ReconciliationIssue {
  id: string;
  userId: string;
  orderId?: string | null;
  type?: IssueType;
  priority?: IssuePriority;
  subject: string;
  description: string;
  status: IssueStatus;
  internalNote?: string | null;
  assignedTo?: string | null;
  resolutionNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateIssueRequest {
  userId: string;
  orderId?: string;
  type?: IssueType;
  priority?: IssuePriority;
  subject: string;
  description: string;
  internalNote?: string;
  assignedTo?: string;
}

export interface PatchIssueRequest {
  status?: IssueStatus;
  priority?: IssuePriority;
  assignedTo?: string;
  resolutionNote?: string;
  internalNote?: string;
}

export interface ResolveWithRefundRequest {
  amount: string;
  reason?: string;
  internalNote?: string;
  resolutionNote?: string;
  initiatedBy?: string;
}

export interface ResolveWithRefundResponse {
  issue: ReconciliationIssue;
  refund: ReconciliationRefund;
}

export interface NestValidationError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// ─── Saves / Wishlist ─────────────────────────────────────────────────────────

export interface SaveRecord {
  id: string;
  userId: string;
  productId: string;
  product?: ApiProduct;
  createdAt?: string;
}

/** `GET /saves/:productId/status` */
export interface SaveStatusResponse {
  saved: boolean;
}

// ─── Shipping quote ────────────────────────────────────────────────────────────

export interface ShippingQuoteRequest {
  weight: number;
  length?: number;
  width?: number;
  height?: number;
  destination: "lagos" | "outside_lagos";
  service: "air" | "ocean_small";
  bulkCommercial?: boolean;
  isTV?: boolean;
}

export interface ShippingQuoteResponse {
  actualWeight: number;
  dimWeight: number;
  billableWeight: number;
  baseRate: number;
  tvFee: number;
  bulkSurcharge: number;
  total: number;
  breakdown: string[];
}

// ─── Landed cost quote ─────────────────────────────────────────────────────────

export type LandedCostDestination = "lagos" | "outside_lagos";
export type LandedCostService = "air" | "ocean_small";
export type LandedCostCategory =
  | "sneakers"
  | "clothing"
  | "phone"
  | "laptop"
  | "tablet"
  | "tv"
  | "electronics_small"
  | "electronics_large"
  | "accessories"
  | "books"
  | "generic";

export type LandedCostMarketplace =
  | "amazon"
  | "apple"
  | "nike"
  | "converse"
  | "zara"
  | "stockx"
  | "goat"
  | "ebay"
  | "shein"
  | "jumia"
  | "generic";

/** `POST /landed-cost/quote` — Mode A (by productId) or Mode B (raw inputs). */
export type LandedCostQuoteRequest =
  | {
      productId: string;
      quantity: number;
      destination: LandedCostDestination;
      shippingService: LandedCostService;
      category?: LandedCostCategory;
      weightLbs?: number;
      dimensions?: { lengthIn: number; widthIn: number; heightIn: number };
      displayCurrency?: string;
    }
  | {
      productPriceUsd: number;
      marketplace: LandedCostMarketplace;
      quantity: number;
      destination: LandedCostDestination;
      shippingService: LandedCostService;
      category?: LandedCostCategory;
      weightLbs?: number;
      dimensions?: { lengthIn: number; widthIn: number; heightIn: number };
      displayCurrency?: string;
    };

export interface LandedCostQuoteResponse {
  marketplace?: string;
  category?: string;
  quantity: number;
  estimatedWeightLbs?: number;
  /** `high` = reliable data; `medium` = approximated; `low` = generic fallback — show disclaimer when low. */
  marketplaceConfidence?: "high" | "medium" | "low";
  productSubtotalUsd: number;
  marketplaceTaxUsd: number;
  marketplaceShippingUsd: number;
  domesticHandlingUsd: number;
  internationalShippingUsd: number;
  customsDutyUsd: number;
  customsVatUsd: number;
  customsClearingFeeUsd: number;
  fxBufferUsd: number;
  riskBufferUsd: number;
  serviceChargeUsd: number;
  discountUsd: number;
  totalUsd: number;
  displayCurrency?: string;
  totalDisplay?: number;
  breakdown: string[];
}

// ─── User reconciliation ───────────────────────────────────────────────────────

export interface CreatePriceDisputeRequest {
  orderId: string;
  expectedTotal?: number;
  reason?: string;
}

export interface CreateUserIssueRequest {
  orderId?: string;
  type: IssueType;
  subject: string;
  description: string;
}

/** User-facing issue (same shape as admin `ReconciliationIssue` but returned from `/reconciliation/my-issues`). */
export type UserIssue = ReconciliationIssue;

// ─── Passkeys (WebAuthn) ───────────────────────────────────────────────────────

export interface PasskeyCredential {
  id: string;
  credentialId: string;
  deviceType: "singleDevice" | "multiDevice";
  backedUp: boolean;
  transports?: string[];
  friendlyName?: string | null;
  createdAt: string;
}

export interface PasskeyRegisterFinishRequest {
  response: unknown;
  friendlyName?: string;
}

export interface PasskeyRegisterFinishResponse {
  verified: boolean;
  credentialId: string;
}

export interface PasskeyLoginFinishResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

// ─── Admin shipping rates ──────────────────────────────────────────────────────

export interface ShippingRatesResponse {
  airRateLagosPerLb?: number | null;
  airRateOutsideLagosPerLb?: number | null;
  airMinimumLagos?: number | null;
  airMinimumOutsideLagos?: number | null;
  minWeightLbs?: number | null;
  bulkCommercialSurcharge?: number | null;
  tvClearingFee?: number | null;
  oceanSmallBoxRate?: number | null;
  dimDivisor?: number | null;
}

export type PatchShippingRatesRequest = Partial<ShippingRatesResponse>;

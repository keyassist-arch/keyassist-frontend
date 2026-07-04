import type { BaseQueryApi, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth, refreshBaseQuery } from "@/store/routes/base-query";
import { credentialsReceived, profileSynced, tokensRefreshed } from "@/store/slices/authSlice";
import { isTokenLoginResult } from "@/lib/auth-login-guards";
import type {
  AddCartItemRequest,
  ApiProduct,
  CartResponse,
  Category,
  PaginatedApiProducts,
  CreateOrderRequest,
  CreateIssueRequest,
  CreatePriceDisputeRequest,
  CreateRefundRequest,
  CreateUserIssueRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  InitializePaymentRequest,
  LandedCostQuoteRequest,
  LandedCostQuoteResponse,
  Login2faRequest,
  LoginRequest,
  LoginResult,
  Me2faSetupResponse,
  Me2faStatusResponse,
  Me2faDisableRequest,
  Me2faEnableRequest,
  MeResponse,
  SendPhoneOtpRequest,
  SendPhoneOtpResponse,
  VerifyPhoneOtpRequest,
  VerifyPhoneOtpResponse,
  OrderResponse,
  OrderStatus,
  PasskeyCredential,
  PasskeyRegisterFinishRequest,
  PasskeyRegisterFinishResponse,
  PasskeyLoginFinishResponse,
  PatchIssueRequest,
  PatchShippingRatesRequest,
  PendingPaymentResponse,
  PatchAdminOrderRequest,
  PatchMeRequest,
  PaymentInitResponse,
  PaymentMethodsResponse,
  PaypalCaptureRequest,
  SavedPaymentMethod,
  StripeSetupIntentResponse,
  StripeConfirmSavedMethodRequest,
  PaypalVaultSetupResponse,
  PaypalVaultConfirmRequest,
  ProductImportResponse,
  ManualProductImportRequest,
  ManualProductImportResponse,
  ReconciliationIssue,
  ReconciliationRefund,
  RefreshRequest,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
  ResolveWithRefundRequest,
  ResolveWithRefundResponse,
  CartSyncRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  SaveRecord,
  SaveStatusResponse,
  ScrapePreviewResponse,
  ShippingQuoteRequest,
  ShippingQuoteResponse,
  ShippingRatesResponse,
  UserIssue,
  VariantPriceResponse,
  PatchCartItemRequest,
  VerifyEmailRequest,
  VerifyEmailResponse,
  TokenResponse,
} from "@/types/api";
import type {
  WannaBuyItem,
  Batch,
  AddWannaBuyItemRequest,
  AdminQuoteRequest,
} from "@/types/index";

async function postAuthJson<TBody>(
  url: string,
  body: TBody,
  api: BaseQueryApi,
  extra: object
): Promise<{ data: TokenResponse } | { error: FetchBaseQueryError }> {
  const result = await refreshBaseQuery({ url, method: "POST", body }, api, extra);
  if (result.error) {
    return { error: result.error };
  }
  return { data: result.data as TokenResponse };
}

export const unifiedCommerceApi = createApi({
  reducerPath: "unifiedCommerceApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Me", "Cart", "Orders", "Order", "Product", "CatalogProducts", "Import", "AdminOrders", "AdminProducts", "Refunds", "Issues", "Saves", "PasskeyCredentials", "ShippingRates", "MyIssues", "Categories", "PaymentMethods", "WannaBuy", "Batches"],
  endpoints: (builder) => ({
    /* ---------- Public / health ---------- */
    getHealth: builder.query<Record<string, unknown>, void>({
      query: () => ({ url: "/health", method: "GET" }),
    }),

    /* ---------- Auth (root) ---------- */
    register: builder.mutation<RegisterResponse, RegisterRequest>({
      queryFn: async (body, api, extra) => {
        const result = await refreshBaseQuery({ url: "/auth/register", method: "POST", body }, api, extra);
        if (result.error) return { error: result.error };
        return { data: result.data as RegisterResponse };
      },
    }),

    resendVerification: builder.mutation<ResendVerificationResponse, ResendVerificationRequest>({
      queryFn: async (body, api, extra) => {
        const result = await refreshBaseQuery({ url: "/auth/resend-verification", method: "POST", body }, api, extra);
        if (result.error) return { error: result.error };
        return { data: result.data as ResendVerificationResponse };
      },
    }),

    login: builder.mutation<LoginResult, LoginRequest>({
      queryFn: async (body, api, extra) => {
        const result = await refreshBaseQuery({ url: "/auth/login", method: "POST", body }, api, extra);
        if (result.error) return { error: result.error };
        return { data: result.data as LoginResult };
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (!isTokenLoginResult(data)) return;
          dispatch(
            credentialsReceived({
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              expiresIn: data.expiresIn,
              email: arg.email,
            })
          );
          if (data.cart) {
            dispatch(unifiedCommerceApi.util.invalidateTags(["Cart"]));
          }
        } catch {
          /* handled by hook */
        }
      },
    }),

    login2fa: builder.mutation<TokenResponse & { cart?: CartResponse }, Login2faRequest>({
      queryFn: async (body, api, extra) => {
        const result = await refreshBaseQuery({ url: "/auth/login/2fa", method: "POST", body }, api, extra);
        if (result.error) return { error: result.error };
        return { data: result.data as TokenResponse & { cart?: CartResponse } };
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            credentialsReceived({
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              expiresIn: data.expiresIn,
            })
          );
          if (data.cart) {
            dispatch(unifiedCommerceApi.util.invalidateTags(["Cart"]));
          }
        } catch {
          /* handled by hook */
        }
      },
    }),

    refresh: builder.mutation<TokenResponse, RefreshRequest>({
      queryFn: async (body, api, extra) => postAuthJson("/auth/refresh", body, api, extra),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(tokensRefreshed(data));
        } catch {
          /* handled by hook */
        }
      },
    }),

    forgotPassword: builder.mutation<ForgotPasswordResponse, ForgotPasswordRequest>({
      queryFn: async (body, api, extra) => {
        const result = await refreshBaseQuery({ url: "/auth/forgot-password", method: "POST", body }, api, extra);
        if (result.error) return { error: result.error };
        return { data: result.data as ForgotPasswordResponse };
      },
    }),

    resetPassword: builder.mutation<ResetPasswordResponse, ResetPasswordRequest>({
      queryFn: async (body, api, extra) => {
        const result = await refreshBaseQuery({ url: "/auth/reset-password", method: "POST", body }, api, extra);
        if (result.error) return { error: result.error };
        return { data: result.data as ResetPasswordResponse };
      },
    }),

    verifyEmail: builder.mutation<VerifyEmailResponse, VerifyEmailRequest>({
      queryFn: async (body, api, extra) => {
        const result = await refreshBaseQuery({ url: "/auth/verify-email", method: "POST", body }, api, extra);
        if (result.error) return { error: result.error };
        return { data: result.data as VerifyEmailResponse };
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            credentialsReceived({
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              expiresIn: data.expiresIn,
            })
          );
          dispatch(unifiedCommerceApi.util.invalidateTags(["Me", "Cart"]));
        } catch {
          /* surfaced in UI */
        }
      },
    }),

    /* ---------- User profile (root) ---------- */
    getMe: builder.query<MeResponse, void>({
      query: () => ({ url: "/me", method: "GET" }),
      providesTags: ["Me"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(profileSynced({ id: data.id, email: data.email, role: data.role }));
        } catch {
          /* optional */
        }
      },
    }),

    patchMe: builder.mutation<MeResponse, PatchMeRequest>({
      query: (body) => ({ url: "/me", method: "PATCH", body }),
      invalidatesTags: ["Me"],
    }),

    getMe2fa: builder.query<Me2faStatusResponse, void>({
      query: () => ({ url: "/me/2fa", method: "GET" }),
      providesTags: ["Me"],
    }),

    postMe2faSetup: builder.mutation<Me2faSetupResponse, void>({
      query: () => ({ url: "/me/2fa/setup", method: "POST", body: {} }),
      invalidatesTags: ["Me"],
    }),

    postMe2faEnable: builder.mutation<MeResponse, Me2faEnableRequest>({
      query: (body) => ({ url: "/me/2fa/enable", method: "POST", body }),
      invalidatesTags: ["Me"],
    }),

    postMe2faSetupCancel: builder.mutation<void, void>({
      query: () => ({ url: "/me/2fa/setup/cancel", method: "POST", body: {} }),
      invalidatesTags: ["Me"],
    }),

    postMe2faDisable: builder.mutation<MeResponse, Me2faDisableRequest>({
      query: (body) => ({ url: "/me/2fa/disable", method: "POST", body }),
      invalidatesTags: ["Me"],
    }),

    sendPhoneOtp: builder.mutation<SendPhoneOtpResponse, SendPhoneOtpRequest | void>({
      query: (body) => ({ url: "/me/phone/send-otp", method: "POST", body: body ?? {} }),
      invalidatesTags: ["Me"],
    }),

    verifyPhoneOtp: builder.mutation<VerifyPhoneOtpResponse, VerifyPhoneOtpRequest>({
      query: (body) => ({ url: "/me/phone/verify-otp", method: "POST", body }),
      invalidatesTags: ["Me"],
    }),

    /* ---------- Products (public import + get) ---------- */
    importProduct: builder.mutation<ProductImportResponse, { url: string }>({
      query: (body) => ({ url: "/products/import", method: "POST", body }),
      invalidatesTags: ["Import", "CatalogProducts"],
    }),

    createManualProduct: builder.mutation<ManualProductImportResponse, ManualProductImportRequest>({
      query: (body) => ({ url: "/products/manual", method: "POST", body }),
      invalidatesTags: ["CatalogProducts"],
    }),

    getImportStatus: builder.query<ProductImportResponse, string>({
      query: (importId) => ({ url: `/products/import/${importId}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "Import", id }],
    }),

    /** `idOrSlug` — product UUID or readable `slug` (see `GET /products/:idOrSlug`). */
    getProduct: builder.query<ApiProduct, string>({
      query: (idOrSlug) => ({ url: `/products/${encodeURIComponent(idOrSlug)}`, method: "GET" }),
      providesTags: (result) => (result?.id ? [{ type: "Product", id: result.id }] : ["Product"]),
    }),

    /** Variant-aware price lookup (`GET /products/:idOrSlug/variant-price?Axis=value&...`). */
    getVariantPrice: builder.query<VariantPriceResponse, { idOrSlug: string; variantSelection: Record<string, string>; displayCurrency?: string }>({
      query: ({ idOrSlug, variantSelection, displayCurrency }) => {
        const params = new URLSearchParams(variantSelection);
        if (displayCurrency) params.set("displayCurrency", displayCurrency);
        return {
          url: `/products/${encodeURIComponent(idOrSlug)}/variant-price?${params.toString()}`,
          method: "GET",
        };
      },
    }),

    /** Related products for a PDP (`GET /products/:idOrSlug/related`). */
    getRelatedProducts: builder.query<ApiProduct[], { idOrSlug: string; limit?: number; displayCurrency?: string }>({
      query: ({ idOrSlug, limit, displayCurrency }) => {
        const params = new URLSearchParams();
        if (limit) params.set("limit", String(limit));
        if (displayCurrency) params.set("displayCurrency", displayCurrency);
        const qs = params.toString();
        return {
          url: qs
            ? `/products/${encodeURIComponent(idOrSlug)}/related?${qs}`
            : `/products/${encodeURIComponent(idOrSlug)}/related`,
          method: "GET",
        };
      },
      providesTags: (_r, _e, { idOrSlug }) => [{ type: "Product", id: `related-${idOrSlug}` }],
    }),

    /** Public catalog list (`GET /products` or `GET /products?limit=`). */
    getCatalogProducts: builder.query<ApiProduct[], number | void>({
      query: (limit) => ({
        url: limit != null && limit > 0 ? `/products?limit=${limit}` : "/products",
        method: "GET",
      }),
      providesTags: ["CatalogProducts"],
    }),

    /* ---------- Categories (public) ---------- */
    getCategories: builder.query<Category[], void>({
      query: () => ({ url: "/categories", method: "GET" }),
      providesTags: ["Categories"],
    }),

    getCategory: builder.query<Category, string>({
      query: (idOrSlug) => ({ url: `/categories/${encodeURIComponent(idOrSlug)}`, method: "GET" }),
      providesTags: (_r, _e, idOrSlug) => [{ type: "Categories", id: idOrSlug }],
    }),

    getCategoryProducts: builder.query<PaginatedApiProducts, { idOrSlug: string; page?: number; limit?: number; displayCurrency?: string }>({
      query: ({ idOrSlug, page, limit, displayCurrency }) => {
        const params = new URLSearchParams();
        if (page) params.set("page", String(page));
        if (limit) params.set("limit", String(limit));
        if (displayCurrency) params.set("displayCurrency", displayCurrency);
        const qs = params.toString();
        return { url: qs ? `/categories/${encodeURIComponent(idOrSlug)}/products?${qs}` : `/categories/${encodeURIComponent(idOrSlug)}/products`, method: "GET" };
      },
      providesTags: (_r, _e, { idOrSlug }) => [{ type: "Categories", id: `products-${idOrSlug}` }],
    }),

    /* ---------- Cart (protected) ---------- */
    getCart: builder.query<CartResponse, void>({
      query: () => ({ url: "/cart", method: "GET" }),
      providesTags: ["Cart"],
    }),

    addCartItem: builder.mutation<unknown, AddCartItemRequest>({
      query: (body) => ({ url: "/cart/items", method: "POST", body }),
      invalidatesTags: ["Cart"],
    }),

    patchCartItem: builder.mutation<unknown, PatchCartItemRequest>({
      query: ({ itemId, quantity, variantSelection }) => ({
        url: `/cart/items/${itemId}`,
        method: "PATCH",
        body: { quantity, ...(variantSelection ? { variantSelection } : {}) },
      }),
      invalidatesTags: ["Cart"],
    }),

    deleteCartItem: builder.mutation<void, string>({
      query: (itemId) => ({ url: `/cart/items/${itemId}`, method: "DELETE" }),
      invalidatesTags: ["Cart"],
    }),

    syncCart: builder.mutation<CartResponse, CartSyncRequest>({
      query: (body) => ({ url: "/cart/sync", method: "POST", body }),
      invalidatesTags: ["Cart"],
    }),

    /* ---------- Orders (protected) ---------- */
    createOrder: builder.mutation<OrderResponse, CreateOrderRequest>({
      query: (body) => ({ url: "/orders", method: "POST", body }),
      invalidatesTags: ["Cart", "Orders"],
    }),

    getOrders: builder.query<OrderResponse[], { status?: OrderStatus } | void>({
      query: (arg) => {
        const status = arg && typeof arg === "object" && arg.status ? arg.status : undefined;
        return {
          url: status ? `/orders?status=${encodeURIComponent(status)}` : "/orders",
          method: "GET",
        };
      },
      providesTags: ["Orders"],
    }),

    /** Most recent `PENDING` order — prefer over scanning `getOrders` for “complete payment” UX. */
    getPendingPayment: builder.query<PendingPaymentResponse, void>({
      query: () => ({ url: "/orders/pending-payment", method: "GET" }),
      providesTags: ["Orders"],
    }),

    getOrder: builder.query<OrderResponse, string>({
      query: (id) => ({ url: `/orders/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "Order", id }],
    }),

    /* ---------- Payments ---------- */
    getPaymentMethods: builder.query<PaymentMethodsResponse, void>({
      query: () => ({ url: "/payments/methods", method: "GET" }),
    }),

    initializePayment: builder.mutation<PaymentInitResponse, InitializePaymentRequest>({
      query: (body) => ({ url: "/payments/initialize", method: "POST", body }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Order", id: arg.orderId }, "Orders"],
    }),

    capturePaypal: builder.mutation<OrderResponse, PaypalCaptureRequest>({
      query: (body) => ({ url: "/payments/paypal/capture", method: "POST", body }),
      invalidatesTags: (_r, _e, arg) => [{ type: "Order", id: arg.orderId }, "Orders"],
    }),

    /* ---------- Admin routes ---------- */
    getAdminOrders: builder.query<OrderResponse[], void>({
      query: () => ({ url: "/admin/orders", method: "GET" }),
      providesTags: ["AdminOrders"],
    }),

    patchAdminOrder: builder.mutation<OrderResponse, { id: string; body: PatchAdminOrderRequest }>({
      query: ({ id, body }) => ({ url: `/admin/orders/${id}`, method: "PATCH", body }),
      invalidatesTags: ["AdminOrders", "Orders"],
    }),

    getAdminProducts: builder.query<ApiProduct[], void>({
      query: () => ({ url: "/admin/products", method: "GET" }),
      providesTags: ["AdminProducts"],
    }),

    postAdminScrapePreview: builder.mutation<ScrapePreviewResponse, { url: string }>({
      query: (body) => ({ url: "/admin/scrape-preview", method: "POST", body }),
    }),

    deleteAdminProduct: builder.mutation<void, string>({
      query: (id) => ({ url: `/admin/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["AdminProducts", "CatalogProducts"],
    }),

    /* ---------- Reconciliation — refunds (admin) ---------- */
    createRefund: builder.mutation<ReconciliationRefund, CreateRefundRequest>({
      query: (body) => ({ url: "/admin/reconciliation/refunds", method: "POST", body }),
      invalidatesTags: ["Refunds", "AdminOrders"],
    }),

    getRefunds: builder.query<ReconciliationRefund[], { orderId?: string } | void>({
      query: (arg) => {
        const orderId = arg && typeof arg === "object" && arg.orderId ? arg.orderId : undefined;
        return {
          url: orderId ? `/admin/reconciliation/refunds?orderId=${encodeURIComponent(orderId)}` : "/admin/reconciliation/refunds",
          method: "GET",
        };
      },
      providesTags: ["Refunds"],
    }),

    getRefund: builder.query<ReconciliationRefund, string>({
      query: (id) => ({ url: `/admin/reconciliation/refunds/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "Refunds", id }],
    }),

    /* ---------- Reconciliation — issues (admin) ---------- */
    createIssue: builder.mutation<ReconciliationIssue, CreateIssueRequest>({
      query: (body) => ({ url: "/admin/reconciliation/issues", method: "POST", body }),
      invalidatesTags: ["Issues"],
    }),

    getIssues: builder.query<ReconciliationIssue[], { status?: string; userId?: string; orderId?: string; type?: string; priority?: string } | void>({
      query: (arg) => {
        const params = new URLSearchParams();
        if (arg && typeof arg === "object") {
          if (arg.status) params.set("status", arg.status);
          if (arg.userId) params.set("userId", arg.userId);
          if (arg.orderId) params.set("orderId", arg.orderId);
          if (arg.type) params.set("type", arg.type);
          if (arg.priority) params.set("priority", arg.priority);
        }
        const qs = params.toString();
        return { url: qs ? `/admin/reconciliation/issues?${qs}` : "/admin/reconciliation/issues", method: "GET" };
      },
      transformResponse: (response: any) => {
        if (Array.isArray(response)) return response;
        if (response?.issues && Array.isArray(response.issues)) return response.issues;
        if (response?.data && Array.isArray(response.data)) return response.data;
        return Array.isArray(response) ? response : [];
      },
      providesTags: ["Issues"],
    }),

    getIssue: builder.query<ReconciliationIssue, string>({
      query: (id) => ({ url: `/admin/reconciliation/issues/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "Issues", id }],
    }),

    patchIssue: builder.mutation<ReconciliationIssue, { id: string; body: PatchIssueRequest }>({
      query: ({ id, body }) => ({ url: `/admin/reconciliation/issues/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Issues"],
    }),

    resolveWithRefund: builder.mutation<ResolveWithRefundResponse, { id: string; body: ResolveWithRefundRequest }>({
      query: ({ id, body }) => ({ url: `/admin/reconciliation/issues/${id}/resolve-with-refund`, method: "POST", body }),
      invalidatesTags: ["Issues", "Refunds", "AdminOrders"],
    }),

    /* ---------- Saves / wishlist (protected) ---------- */
    getSaves: builder.query<SaveRecord[], void>({
      query: () => ({ url: "/saves", method: "GET" }),
      providesTags: ["Saves"],
    }),

    saveProduct: builder.mutation<SaveRecord, string>({
      query: (productId) => ({ url: `/saves/${productId}`, method: "POST", body: {} }),
      invalidatesTags: ["Saves"],
    }),

    unsaveProduct: builder.mutation<void, string>({
      query: (productId) => ({ url: `/saves/${productId}`, method: "DELETE" }),
      invalidatesTags: ["Saves"],
    }),

    getSaveStatus: builder.query<SaveStatusResponse, string>({
      query: (productId) => ({ url: `/saves/${productId}/status`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "Saves", id }],
    }),

    /* ---------- Shipping quote (public) ---------- */
    getShippingQuote: builder.mutation<ShippingQuoteResponse, ShippingQuoteRequest>({
      query: (body) => ({ url: "/shipping/quote", method: "POST", body }),
    }),

    /* ---------- Landed cost quote (public) — use for checkout ---------- */
    getLandedCostQuote: builder.mutation<LandedCostQuoteResponse, LandedCostQuoteRequest>({
      query: (body) => ({ url: "/landed-cost/quote", method: "POST", body }),
    }),

    /* ---------- User reconciliation ---------- */
    createPriceDispute: builder.mutation<ReconciliationIssue, CreatePriceDisputeRequest>({
      query: (body) => ({ url: "/reconciliation/price-disputes", method: "POST", body }),
      invalidatesTags: ["MyIssues"],
    }),

    getMyIssues: builder.query<UserIssue[], { status?: string; orderId?: string; limit?: number; offset?: number } | void>({
      query: (arg) => {
        const params = new URLSearchParams();
        if (arg && typeof arg === "object") {
          if (arg.status) params.set("status", arg.status);
          if (arg.orderId) params.set("orderId", arg.orderId);
          if (arg.limit != null) params.set("limit", String(arg.limit));
          if (arg.offset != null) params.set("offset", String(arg.offset));
        }
        const qs = params.toString();
        return { url: qs ? `/reconciliation/my-issues?${qs}` : "/reconciliation/my-issues", method: "GET" };
      },
      transformResponse: (response: any) => {
        // Handle wrapped response (e.g., { issues: [...] } or { data: [...] })
        if (Array.isArray(response)) return response;
        if (response?.issues && Array.isArray(response.issues)) return response.issues;
        if (response?.data && Array.isArray(response.data)) return response.data;
        return Array.isArray(response) ? response : [];
      },
      providesTags: ["MyIssues"],
    }),

    getMyIssue: builder.query<UserIssue, string>({
      query: (id) => ({ url: `/reconciliation/my-issues/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: "MyIssues", id }],
    }),

    createUserIssue: builder.mutation<ReconciliationIssue, CreateUserIssueRequest>({
      query: (body) => ({ url: "/reconciliation/issues", method: "POST", body }),
      invalidatesTags: ["MyIssues"],
    }),

    /* ---------- Passkeys (WebAuthn) ---------- */
    passkeyLoginStart: builder.mutation<PublicKeyCredentialRequestOptionsJSON, void>({
      queryFn: async (_arg, api, extra) => {
        const result = await refreshBaseQuery({ url: "/auth/passkey/login/start", method: "POST", body: {} }, api, extra);
        if (result.error) return { error: result.error };
        return { data: result.data as PublicKeyCredentialRequestOptionsJSON };
      },
    }),

    passkeyLoginFinish: builder.mutation<PasskeyLoginFinishResponse, unknown>({
      queryFn: async (body, api, extra) => {
        const result = await refreshBaseQuery({ url: "/auth/passkey/login/finish", method: "POST", body }, api, extra);
        if (result.error) return { error: result.error };
        const data = result.data as PasskeyLoginFinishResponse;
        return { data };
      },
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(credentialsReceived({ accessToken: data.accessToken, refreshToken: data.refreshToken, expiresIn: data.expiresIn }));
        } catch {
          /* surfaced in UI */
        }
      },
    }),

    passkeyRegisterStart: builder.mutation<PublicKeyCredentialCreationOptionsJSON, void>({
      query: () => ({ url: "/auth/passkey/register/start", method: "POST", body: {} }),
    }),

    passkeyRegisterFinish: builder.mutation<PasskeyRegisterFinishResponse, PasskeyRegisterFinishRequest>({
      query: (body) => ({ url: "/auth/passkey/register/finish", method: "POST", body }),
      invalidatesTags: ["PasskeyCredentials"],
    }),

    getPasskeyCredentials: builder.query<PasskeyCredential[], void>({
      query: () => ({ url: "/auth/passkey/credentials", method: "GET" }),
      providesTags: ["PasskeyCredentials"],
    }),

    patchPasskeyCredential: builder.mutation<PasskeyCredential, { id: string; friendlyName: string }>({
      query: ({ id, friendlyName }) => ({ url: `/auth/passkey/credentials/${id}`, method: "PATCH", body: { friendlyName } }),
      invalidatesTags: ["PasskeyCredentials"],
    }),

    deletePasskeyCredential: builder.mutation<void, string>({
      query: (id) => ({ url: `/auth/passkey/credentials/${id}`, method: "DELETE" }),
      invalidatesTags: ["PasskeyCredentials"],
    }),

    /* ---------- Admin shipping rates ---------- */
    getAdminShippingRates: builder.query<ShippingRatesResponse | null, void>({
      query: () => ({ url: "/admin/shipping-rates", method: "GET" }),
      providesTags: ["ShippingRates"],
    }),

    patchAdminShippingRates: builder.mutation<ShippingRatesResponse, PatchShippingRatesRequest>({
      query: (body) => ({ url: "/admin/shipping-rates", method: "PATCH", body }),
      invalidatesTags: ["ShippingRates"],
    }),

    /* ---------- Saved payment methods (protected) ---------- */
    getSavedPaymentMethods: builder.query<SavedPaymentMethod[], void>({
      query: () => ({ url: "/payments/saved-methods", method: "GET" }),
      providesTags: ["PaymentMethods"],
    }),

    createStripeSetupIntent: builder.mutation<StripeSetupIntentResponse, void>({
      query: () => ({ url: "/payments/saved-methods/stripe/setup-intent", method: "POST", body: {} }),
    }),

    confirmStripeSavedMethod: builder.mutation<SavedPaymentMethod, StripeConfirmSavedMethodRequest>({
      query: (body) => ({ url: "/payments/saved-methods/stripe/confirm", method: "POST", body }),
      invalidatesTags: ["PaymentMethods"],
    }),

    createPaypalVaultSetup: builder.mutation<PaypalVaultSetupResponse, { returnUrl: string; cancelUrl: string }>({
      query: (body) => ({ url: "/payments/saved-methods/paypal/setup-token", method: "POST", body }),
    }),

    confirmPaypalVaultSetup: builder.mutation<SavedPaymentMethod, PaypalVaultConfirmRequest>({
      query: (body) => ({ url: "/payments/saved-methods/paypal/confirm", method: "POST", body }),
      invalidatesTags: ["PaymentMethods"],
    }),

    setDefaultPaymentMethod: builder.mutation<SavedPaymentMethod, string>({
      query: (id) => ({ url: `/payments/saved-methods/${id}/default`, method: "PATCH", body: {} }),
      invalidatesTags: ["PaymentMethods"],
    }),

    deletePaymentMethod: builder.mutation<void, string>({
      query: (id) => ({ url: `/payments/saved-methods/${id}`, method: "DELETE" }),
      invalidatesTags: ["PaymentMethods"],
    }),

    // ── Wanna Buy List (user) ─────────────────────────────────────────────────
    addWannaBuyItem: builder.mutation<WannaBuyItem, AddWannaBuyItemRequest>({
      query: (body) => ({ url: "/wanna-buy", method: "POST", body }),
      invalidatesTags: ["WannaBuy"],
    }),
    getWannaBuyItems: builder.query<WannaBuyItem[], void>({
      query: () => "/wanna-buy",
      providesTags: ["WannaBuy"],
    }),
    payWannaBuyItem: builder.mutation<OrderResponse, string>({
      query: (id) => ({ url: `/wanna-buy/${id}/pay`, method: "POST" }),
      invalidatesTags: ["WannaBuy", "Orders"],
    }),

    // ── Wanna Buy List (admin) ────────────────────────────────────────────────
    getAdminBatches: builder.query<Batch[], void>({
      query: () => "/admin/batches",
      providesTags: ["Batches"],
    }),
    createAdminBatch: builder.mutation<Batch, { label?: string }>({
      query: (body) => ({ url: "/admin/batches", method: "POST", body }),
      invalidatesTags: ["Batches"],
    }),
    patchAdminBatchStatus: builder.mutation<Batch, { id: string; status: string }>({
      query: ({ id, status }) => ({ url: `/admin/batches/${id}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: ["Batches"],
    }),
    getAdminBatchItems: builder.query<WannaBuyItem[], string>({
      query: (batchId) => `/admin/batches/${batchId}/items`,
      providesTags: (_r, _e, batchId) => [{ type: "Batches", id: batchId }],
    }),
    patchAdminWannaBuyQuote: builder.mutation<WannaBuyItem, { id: string; body: AdminQuoteRequest }>({
      query: ({ id, body }) => ({ url: `/admin/wanna-buy/${id}/quote`, method: "PATCH", body }),
      invalidatesTags: ["Batches", "WannaBuy"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryQuery,
  useGetCategoryProductsQuery,
  useGetHealthQuery,
  useRegisterMutation,
  useResendVerificationMutation,
  useLoginMutation,
  useLogin2faMutation,
  useRefreshMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  usePatchMeMutation,
  useGetMe2faQuery,
  usePostMe2faSetupMutation,
  usePostMe2faEnableMutation,
  usePostMe2faSetupCancelMutation,
  usePostMe2faDisableMutation,
  useSendPhoneOtpMutation,
  useVerifyPhoneOtpMutation,
  useImportProductMutation,
  useCreateManualProductMutation,
  useGetImportStatusQuery,
  useLazyGetImportStatusQuery,
  useGetProductQuery,
  useLazyGetProductQuery,
  useGetVariantPriceQuery,
  useGetRelatedProductsQuery,
  useGetCatalogProductsQuery,
  useGetCartQuery,
  useAddCartItemMutation,
  usePatchCartItemMutation,
  useDeleteCartItemMutation,
  useSyncCartMutation,
  useCreateOrderMutation,
  useGetOrdersQuery,
  useGetPendingPaymentQuery,
  useGetOrderQuery,
  useLazyGetOrderQuery,
  useGetPaymentMethodsQuery,
  useInitializePaymentMutation,
  useCapturePaypalMutation,
  useGetAdminOrdersQuery,
  usePatchAdminOrderMutation,
  useGetAdminProductsQuery,
  usePostAdminScrapePreviewMutation,
  useDeleteAdminProductMutation,
  useCreateRefundMutation,
  useGetRefundsQuery,
  useGetRefundQuery,
  useCreateIssueMutation,
  useGetIssuesQuery,
  useGetIssueQuery,
  usePatchIssueMutation,
  useResolveWithRefundMutation,
  // Saves / wishlist
  useGetSavesQuery,
  useSaveProductMutation,
  useUnsaveProductMutation,
  useGetSaveStatusQuery,
  // Shipping quote
  useGetShippingQuoteMutation,
  // Landed cost quote
  useGetLandedCostQuoteMutation,
  // User reconciliation
  useCreatePriceDisputeMutation,
  useCreateUserIssueMutation,
  useGetMyIssuesQuery,
  useGetMyIssueQuery,
  // Passkeys
  usePasskeyLoginStartMutation,
  usePasskeyLoginFinishMutation,
  usePasskeyRegisterStartMutation,
  usePasskeyRegisterFinishMutation,
  useGetPasskeyCredentialsQuery,
  usePatchPasskeyCredentialMutation,
  useDeletePasskeyCredentialMutation,
  // Admin shipping rates
  useGetAdminShippingRatesQuery,
  usePatchAdminShippingRatesMutation,
  // Saved payment methods
  useGetSavedPaymentMethodsQuery,
  useCreateStripeSetupIntentMutation,
  useConfirmStripeSavedMethodMutation,
  useCreatePaypalVaultSetupMutation,
  useConfirmPaypalVaultSetupMutation,
  useSetDefaultPaymentMethodMutation,
  useDeletePaymentMethodMutation,
  // Wanna Buy List
  useAddWannaBuyItemMutation,
  useGetWannaBuyItemsQuery,
  usePayWannaBuyItemMutation,
  useGetAdminBatchesQuery,
  useCreateAdminBatchMutation,
  usePatchAdminBatchStatusMutation,
  useGetAdminBatchItemsQuery,
  usePatchAdminWannaBuyQuoteMutation,
} = unifiedCommerceApi;

import type { BaseQueryApi, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth, refreshBaseQuery } from "@/store/routes/base-query";
import { credentialsReceived, profileSynced, tokensRefreshed } from "@/store/slices/authSlice";
import { isTokenLoginResult } from "@/lib/auth-login-guards";
import type {
  AddCartItemRequest,
  ApiProduct,
  CartResponse,
  CreateOrderRequest,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  InitializePaymentRequest,
  Login2faRequest,
  LoginRequest,
  LoginResult,
  Me2faSetupResponse,
  Me2faStatusResponse,
  Me2faDisableRequest,
  Me2faEnableRequest,
  MeResponse,
  OrderResponse,
  OrderStatus,
  PendingPaymentResponse,
  PatchAdminOrderRequest,
  PatchMeRequest,
  PaymentInitResponse,
  PaymentMethodsResponse,
  PaypalCaptureRequest,
  ProductImportResponse,
  RefreshRequest,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
  CartSyncRequest,
  ResetPasswordRequest,
  ResetPasswordResponse,
  ScrapePreviewResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  TokenResponse,
} from "@/types/api";

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
  tagTypes: ["Me", "Cart", "Orders", "Order", "Product", "CatalogProducts", "Import", "AdminOrders", "AdminProducts"],
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

    /* ---------- Products (public import + get) ---------- */
    importProduct: builder.mutation<ProductImportResponse, { url: string }>({
      query: (body) => ({ url: "/products/import", method: "POST", body }),
      invalidatesTags: ["Import", "CatalogProducts"],
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

    /** Public catalog list (`GET /products` or `GET /products?limit=`). */
    getCatalogProducts: builder.query<ApiProduct[], number | void>({
      query: (limit) => ({
        url: limit != null && limit > 0 ? `/products?limit=${limit}` : "/products",
        method: "GET",
      }),
      providesTags: ["CatalogProducts"],
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

    patchCartItem: builder.mutation<unknown, { itemId: string; quantity: number }>({
      query: ({ itemId, quantity }) => ({
        url: `/cart/items/${itemId}`,
        method: "PATCH",
        body: { quantity },
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
  }),
});

export const {
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
  useImportProductMutation,
  useGetImportStatusQuery,
  useLazyGetImportStatusQuery,
  useGetProductQuery,
  useLazyGetProductQuery,
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
} = unifiedCommerceApi;

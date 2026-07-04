"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { Steps } from "@/components/ui/steps";
import { InnerShell } from "@/components/layout/inner-shell";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  useCreateOrderMutation,
  useGetCartQuery,
  useGetMeQuery,
  useGetOrderQuery,
  useGetPaymentMethodsQuery,
  useGetLandedCostQuoteMutation,
  useInitializePaymentMutation,
} from "@/store/routes/unified-commerce-api";
import type {
  LandedCostDestination,
  LandedCostService,
  LandedCostCategory,
  LandedCostQuoteResponse,
  OrderDisplaySummary,
  OrderResponse,
  PaymentInitResponse,
  PaymentMethodEntry,
  PaymentProvider,
} from "@/types/api";
import { ErrorState, LoadingState, SuccessState } from "@/components/feedback/query-state";
import { getErrorMessage } from "@/lib/rtk-error";
import { coerceNumber } from "@/lib/coerce-number";
import { formatApiMoney } from "@/lib/format-price";
import { orderLineTotal } from "@/lib/dashboard-orders";
import {
  clearPendingCheckoutOrderId,
  getPendingCheckoutOrderId,
  setPendingCheckoutOrderId,
} from "@/lib/pending-checkout-order";
import { orderCanInitializePayment } from "@/lib/order-checkout";
import { isUuid } from "@/lib/uuid";
import { loginUrl } from "@/lib/auth-redirect";
import { unifiedCommerceApi } from "@/store/routes/unified-commerce-api";

const PAYPAL_STORAGE = "uc_paypal_checkout";

function CheckoutDisplaySummary({ summary }: { summary: OrderDisplaySummary }) {
  const cur = summary.currency;
  return (
    <>
      <div className="flex items-center justify-between">
        <span>Product</span>
        <span className="font-medium tabular-nums">{formatApiMoney(Number(summary.product), cur)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-black/60">Import &amp; delivery</span>
        <span className="font-medium tabular-nums">{formatApiMoney(Number(summary.importAndDelivery), cur)}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-black/60">Service fee</span>
        <span className="font-medium tabular-nums">{formatApiMoney(Number(summary.serviceFee), cur)}</span>
      </div>
      {Number(summary.discount) > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-black/60">Discount</span>
          <span className="font-medium tabular-nums text-emerald-600">-{formatApiMoney(Number(summary.discount), cur)}</span>
        </div>
      )}
      <div className="flex items-center justify-between border-t border-black/10 pt-2 font-semibold">
        <span>Total</span>
        <span className="tabular-nums">{formatApiMoney(Number(summary.total), cur)}</span>
      </div>
    </>
  );
}

const DEFAULT_METHODS: PaymentMethodEntry[] = [
  { provider: "paystack", available: true, reason: null },
  { provider: "stripe", available: true, reason: null },
  { provider: "paypal", available: true, reason: null },
  { provider: "myaza", available: true, reason: null },
];

function isPaymentProvider(p: string | undefined | null): p is PaymentProvider {
  return p === "paystack" || p === "stripe" || p === "paypal" || p === "myaza";
}

export function CheckoutClient() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.accessToken);
  const searchParams = useSearchParams();
  const { items: localItems, subtotal: localSubtotal } = useCart();
  const { data: me, isLoading: meLoading } = useGetMeQuery(undefined, { skip: !token });
  const { data: cart, isLoading: cartLoading, refetch: refetchCart } = useGetCartQuery(undefined, { skip: !token });
  const { data: paymentMethods, isLoading: methodsLoading, isError: methodsError } = useGetPaymentMethodsQuery();
  const [createOrder, { isLoading: creating, isError: createErr, error: createError }] = useCreateOrderMutation();
  const [getLandedCostQuote, { isLoading: quoting }] = useGetLandedCostQuoteMutation();
  const [initPayment, { isLoading: paying, isError: payErr, error: payError, reset: resetPayError }] =
    useInitializePaymentMutation();

  const phoneVerificationBlocked = Boolean(me?.phoneVerificationRequired && !me?.phoneVerified);

  const [mounted, setMounted] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [orderSnapshot, setOrderSnapshot] = useState<OrderResponse | null>(null);
  const [formError, setFormError] = useState("");
  const [payInitError, setPayInitError] = useState(false);
  const [provider, setProvider] = useState<PaymentProvider>("paystack");
  const [placeOrderBusy, setPlaceOrderBusy] = useState(false);
  const [myazaSession, setMyazaSession] = useState<Extract<PaymentInitResponse, { provider: "myaza" }> | null>(null);
  const [myazaOrderId, setMyazaOrderId] = useState<string | null>(null);

  const [destination, setDestination] = useState<LandedCostDestination>("lagos");
  const [shippingService, setShippingService] = useState<LandedCostService>("air");
  const [category, setCategory] = useState<LandedCostCategory>("generic");
  const [landedCostQuote, setLandedCostQuote] = useState<LandedCostQuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [pendingFormData, setPendingFormData] = useState<{
    fullName: string; line1: string; line2?: string; city: string;
    state?: string; country: string; postalCode?: string; phone?: string;
  } | null>(null);

  const { data: orderFetched, isLoading: orderLoading, refetch: refetchOrder } = useGetOrderQuery(activeOrderId ?? "", {
    skip: !token || !activeOrderId,
  });

  const displayOrder = orderFetched ?? orderSnapshot;

  const resumeParam = (searchParams.get("resume") ?? "").trim();
  const resumeId = resumeParam && isUuid(resumeParam) ? resumeParam : null;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (resumeId) {
      setActiveOrderId(resumeId);
      return;
    }
    const stored = getPendingCheckoutOrderId();
    if (stored && isUuid(stored)) {
      setActiveOrderId(stored);
    }
  }, [resumeId]);

  useEffect(() => {
    if (!displayOrder) return;
    if (displayOrder.status === "PAID") {
      clearPendingCheckoutOrderId();
      setActiveOrderId(null);
      setOrderSnapshot(null);
    }
  }, [displayOrder?.id, displayOrder?.status]);

  useEffect(() => {
    if (!displayOrder?.payment?.provider) return;
    const p = displayOrder.payment.provider;
    if (isPaymentProvider(p)) {
      setProvider(p);
    }
  }, [displayOrder?.payment?.provider]);

  const inPaymentStep = Boolean(
    activeOrderId && displayOrder && orderCanInitializePayment(displayOrder) && !myazaSession
  );

  const showMyaza = Boolean(myazaSession && myazaOrderId);

  const apiItems = cart?.items ?? [];
  const apiCurrency = cart?.currency ?? "USD";
  const apiSubtotal = coerceNumber(cart?.subtotal, 0);
  const apiServiceCharge = coerceNumber(cart?.serviceCharge, 0);
  const apiDiscount = coerceNumber(cart?.discount, 0);
  const apiFees = coerceNumber(cart?.fees, apiServiceCharge - apiDiscount);
  const apiTotal = coerceNumber(cart?.total, apiSubtotal + apiFees);

  const orderCurrency = displayOrder?.items[0]?.currency ?? displayOrder?.currency ?? "USD";
  const orderSubtotalN = useMemo(
    () =>
      displayOrder
        ? displayOrder.items.reduce((s, i) => s + orderLineTotal(i as Parameters<typeof orderLineTotal>[0]), 0)
        : 0,
    [displayOrder]
  );
  const oSub = coerceNumber(displayOrder?.subtotal, orderSubtotalN);
  const oSvc = coerceNumber(displayOrder?.serviceCharge, 0);
  const oDisc = coerceNumber(displayOrder?.discount, 0);
  const oFees = coerceNumber(displayOrder?.fees, oSvc - oDisc);
  const oTotal = coerceNumber(displayOrder?.total, oSub + oFees);
  const methodRows: PaymentMethodEntry[] = useMemo(
    () => (methodsError || !paymentMethods?.methods?.length ? DEFAULT_METHODS : paymentMethods.methods),
    [paymentMethods, methodsError]
  );

  const availableProviders = useMemo(() => methodRows.filter((x) => x.available).map((x) => x.provider), [methodRows]);

  useEffect(() => {
    if (availableProviders.length === 0) return;
    if (!availableProviders.includes(provider)) {
      setProvider(availableProviders[0]!);
    }
  }, [availableProviders, provider]);

  const runInitialize = useCallback(
    async (order: OrderResponse) => {
      setPayInitError(false);
      setFormError("");
      resetPayError();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      try {
        const pay = await initPayment({
          orderId: order.id,
          provider,
          ...(provider === "stripe"
            ? {
                stripeSuccessUrl: origin
                  ? `${origin}/checkout/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`
                  : undefined,
                stripeCancelUrl: origin ? `${origin}/checkout` : undefined,
              }
            : {}),
          ...(provider === "paypal"
            ? {
                paypalReturnUrl: origin ? `${origin}/checkout/paypal/success?order_id=${order.id}` : undefined,
                paypalCancelUrl: origin ? `${origin}/checkout/paypal/cancel?order_id=${order.id}` : undefined,
              }
            : {}),
          ...(provider === "myaza"
            ? {
                myazaReturnUrl: origin ? `${origin}/checkout/myaza/success?order_id=${order.id}` : undefined,
                myazaCancelUrl: origin ? `${origin}/checkout/myaza/cancel?order_id=${order.id}` : undefined,
              }
            : {}),
        }).unwrap();

        if (pay.provider === "paystack") {
          window.location.href = pay.authorizationUrl;
          return;
        }
        if (pay.provider === "stripe") {
          window.location.href = pay.url;
          return;
        }
        if (pay.provider === "paypal") {
          sessionStorage.setItem(
            PAYPAL_STORAGE,
            JSON.stringify({ orderId: order.id, paypalOrderId: pay.paypalOrderId })
          );
          window.location.href = pay.approvalUrl;
          return;
        }
        if (pay.provider === "myaza") {
          setMyazaOrderId(order.id);
          setMyazaSession(pay);
          if (pay.checkoutUrl) {
            window.open(pay.checkoutUrl, "_blank", "noopener,noreferrer");
          }
          void refetchOrder();
        }
      } catch (err) {
        setPayInitError(true);
        setFormError(getErrorMessage(err));
      }
    },
    [provider, initPayment, resetPayError, refetchOrder]
  );

  const onGetQuote = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setQuoteError("");
    if (inPaymentStep) return;
    if (apiItems.length === 0) {
      setFormError("Your cart is empty. Add something from the shop, then come back to checkout.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const fullName = String(fd.get("fullName") ?? "").trim();
    const line1 = String(fd.get("line1") ?? "").trim();
    const city = String(fd.get("city") ?? "").trim();
    const country = String(fd.get("country") ?? "").trim() || "NG";
    if (!fullName || !line1 || !city) {
      setFormError("Full name, address line, and city are required.");
      return;
    }
    setPendingFormData({
      fullName, line1, city, country,
      line2: String(fd.get("line2") ?? "").trim() || undefined,
      state: String(fd.get("state") ?? "").trim() || undefined,
      postalCode: String(fd.get("postalCode") ?? "").trim() || undefined,
      phone: String(fd.get("phone") ?? "").trim() || undefined,
    });
    try {
      const firstItem = cart?.items?.[0];
      const productId = firstItem && typeof firstItem.product === "object" && "id" in firstItem.product
        ? firstItem.product.id
        : undefined;
      const quoteResult = await getLandedCostQuote(
        productId
          ? { productId, quantity: firstItem?.quantity ?? 1, destination, shippingService, category, displayCurrency: "NGN" }
          : { productPriceUsd: apiSubtotal || 1, marketplace: "generic", quantity: 1, destination, shippingService, category, displayCurrency: "NGN" }
      ).unwrap();
      setLandedCostQuote(quoteResult);
    } catch {
      setQuoteError("Could not fetch landed cost estimate. You can still place the order.");
      setLandedCostQuote(null);
    }
  };

  const onPlaceOrder = async () => {
    if (!pendingFormData) return;
    if (phoneVerificationBlocked) {
      setFormError("Verify your phone number via WhatsApp in Settings before checking out.");
      return;
    }
    if (availableProviders.length > 0 && !availableProviders.includes(provider) && !methodsError) {
      setFormError("That payment method is not available right now. Choose another option.");
      return;
    }
    setPlaceOrderBusy(true);
    try {
      const order = await createOrder({
        shippingAddress: pendingFormData,
        landedCost: { destination, shippingService, category },
      }).unwrap();
      setOrderSnapshot(order);
      setActiveOrderId(order.id);
      setPendingCheckoutOrderId(order.id);
      setMyazaSession(null);
      setMyazaOrderId(null);
      setLandedCostQuote(null);
      setPendingFormData(null);
      dispatch(unifiedCommerceApi.util.invalidateTags(["Cart"]));
      void refetchCart();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setPlaceOrderBusy(false);
    }
  };

  const onPay = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    if (!displayOrder || displayOrder.status !== "PENDING") {
      setFormError("This order is not awaiting payment. Open your orders list.");
      return;
    }
    if (availableProviders.length > 0 && !availableProviders.includes(provider) && !methodsError) {
      setFormError("That payment method is not available right now. Choose another option.");
      return;
    }
    void runInitialize(displayOrder);
  };

  const showQuoteConfirm = Boolean(pendingFormData && !inPaymentStep);
  const loading = meLoading || cartLoading || methodsLoading;
  const providerLabels: Record<PaymentProvider, string> = {
    paystack: "Paystack",
    stripe: "Stripe Checkout",
    paypal: "PayPal",
    myaza: "Myaza (crypto)",
  };

  if (!mounted) {
    return (
      <InnerShell>
        <LoadingState label="Loading…" />
      </InnerShell>
    );
  }

  if (!token) {
    return (
      <InnerShell>
        <div className="card max-w-lg space-y-4">
          <h1 className="text-xl font-semibold">Sign in to checkout</h1>
          <p className="text-sm text-black/70">
            Sign in to place an order and pay securely.
            {localItems.length > 0
              ? " Your browsing cart won't carry over after sign-in — you can add items again once you're in."
              : null}
          </p>
          <Link href={loginUrl("/checkout")} className="btn-primary inline-block text-center">
            Sign in
          </Link>
        </div>
      </InnerShell>
    );
  }

  if (activeOrderId && !displayOrder && orderLoading) {
    return (
      <InnerShell>
        <LoadingState label="Loading your order…" />
      </InnerShell>
    );
  }

  if (activeOrderId && displayOrder && displayOrder.status === "PAID") {
    return (
      <InnerShell>
        <div className="card max-w-lg space-y-3">
          <h1 className="text-lg font-semibold">Order already paid</h1>
          <p className="text-sm text-black/70">This order is complete. You can open it from your account.</p>
          <Link className="btn-primary" href={`/dashboard/orders/${displayOrder.id}`}>
            View order
          </Link>
        </div>
      </InnerShell>
    );
  }

  return (
    <InnerShell>
      <div className="space-y-6">
        <section className="card">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Checkout</h1>
              <p className="mt-2 text-sm text-black/70">
                {inPaymentStep
                  ? "Your order is placed. Choose a payment method below to complete checkout."
                  : "Enter your shipping details, then place the order to proceed to payment."}
              </p>
            </div>
            <Steps
              current={1}
              steps={[
                { label: "Cart", href: "/cart" },
                { label: "Checkout", href: "/checkout" },
                { label: "Success", href: "/checkout/success" },
              ]}
            />
          </div>
        </section>

        {loading && !inPaymentStep && <LoadingState label="Loading…" />}
        {createErr && <ErrorState error={createError} title="Couldn't place order" />}
        {payErr && payInitError && <ErrorState error={payError} title="Payment setup failed" />}

        {showMyaza && myazaOrderId ? (
          <section className="card space-y-4 border-shop-accent/30">
            <h2 className="text-lg font-semibold">Complete Myaza payment</h2>
            <p className="text-sm text-black/70">
              Send the indicated amount to the address below, or use the hosted checkout if you opened it in a new tab. Open
              your order to see when the payment clears.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {myazaSession?.qrCode ? (
                <div className="relative h-48 w-48 border border-black/10 bg-white">
                  <Image src={myazaSession.qrCode} alt="" fill className="object-contain p-2" unoptimized />
                </div>
              ) : null}
              {myazaSession ? (
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-black/50">Network / token</dt>
                    <dd className="font-medium">
                      {myazaSession.chain} / {myazaSession.token}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-black/50">Amount</dt>
                    <dd className="font-mono">{myazaSession.amount}</dd>
                  </div>
                  <div>
                    <dt className="text-black/50">Deposit address</dt>
                    <dd className="mt-1 flex items-start gap-2">
                      <span className="break-all font-mono text-xs leading-relaxed">{myazaSession.depositAddress}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(myazaSession.depositAddress).then(() => {
                            setCopiedAddress(true);
                            setTimeout(() => setCopiedAddress(false), 2000);
                          });
                        }}
                        className="shrink-0 rounded-lg border border-black/10 bg-white px-2 py-1 text-xs font-medium text-shop-ink transition hover:bg-black/5 active:scale-95"
                      >
                        {copiedAddress ? "Copied!" : "Copy"}
                      </button>
                    </dd>
                  </div>
                  {myazaSession.checkoutUrl ? (
                    <dd>
                      <a
                        className="text-shop-accent underline"
                        href={myazaSession.checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Myaza checkout
                      </a>
                    </dd>
                  ) : null}
                </dl>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="btn-primary" href={`/dashboard/orders/${myazaOrderId}`}>
                View order
              </Link>
              <Link className="btn-secondary" href="/">
                Continue shopping
              </Link>
            </div>
          </section>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {inPaymentStep && displayOrder && !showMyaza ? (
            <form className="card space-y-4" onSubmit={onPay}>
              <h2 className="text-lg font-semibold">Pay for order {displayOrder.id.slice(0, 8)}…</h2>
              <p className="text-sm text-amber-900/80">
                Status: <span className="font-medium">{displayOrder.status}</span>. Your cart was cleared when the order was placed — use the totals below to complete payment.
              </p>
              {displayOrder.shippingAddress ? (
                <div className="rounded-lg border border-black/10 bg-black/2 p-3 text-sm">
                  <p className="font-medium text-shop-ink">Ship to</p>
                  <p className="mt-1 text-black/80">
                    {displayOrder.shippingAddress.fullName}
                    <br />
                    {displayOrder.shippingAddress.line1}
                    {displayOrder.shippingAddress.line2 ? <>, {displayOrder.shippingAddress.line2}</> : null}
                    <br />
                    {displayOrder.shippingAddress.city}
                    {displayOrder.shippingAddress.state ? `, ${displayOrder.shippingAddress.state}` : ""}{" "}
                    {displayOrder.shippingAddress.postalCode}
                    <br />
                    {displayOrder.shippingAddress.country}
                  </p>
                </div>
              ) : null}

              <h3 className="pt-2 text-base font-semibold">Payment</h3>
              {!methodsError && availableProviders.length === 0 ? (
                <p className="text-sm text-amber-800">No payment methods are available right now.</p>
              ) : null}
              {methodsError ? (
                <p className="text-xs text-black/50">Couldn't check payment options — all methods are shown.</p>
              ) : null}
              <div className="space-y-1.5">
                <p className="text-sm text-black/70">Payment method</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {methodRows.map((m) => {
                    const isSelected = provider === m.provider;
                    const isDisabled = !m.available || (!methodsError && availableProviders.length === 0);
                    return (
                      <label
                        key={m.provider}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                          isDisabled ? "cursor-not-allowed opacity-50" : ""
                        } ${
                          isSelected
                            ? "border-shop-primary bg-shop-primary/[0.03]"
                            : "border-black/10 hover:border-black/25"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentProvider"
                          value={m.provider}
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => {
                            setProvider(m.provider);
                            setPayInitError(false);
                            resetPayError();
                          }}
                          className="sr-only"
                        />
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                            isSelected ? "border-shop-primary" : "border-black/25"
                          }`}
                        >
                          {isSelected && <div className="h-2 w-2 rounded-full bg-shop-primary" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-shop-ink">{providerLabels[m.provider]}</p>
                          {!m.available && m.reason ? (
                            <p className="text-xs text-black/50">{m.reason}</p>
                          ) : null}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
              {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  className="btn-primary w-full sm:w-auto"
                  type="submit"
                  disabled={paying || (!methodsError && availableProviders.length === 0)}
                >
                  {paying ? "Starting…" : "Complete payment"}
                </button>
                {payInitError || payErr ? (
                  <button
                    type="button"
                    className="btn-secondary w-full sm:w-auto"
                    onClick={() => {
                      setFormError("");
                      setPayInitError(false);
                      resetPayError();
                    }}
                  >
                    Dismiss error
                  </button>
                ) : null}
              </div>
              <p className="text-xs text-black/50">
                If payment didn't start, you can <span className="font-medium">try again</span> with the same or a different method. Your order stays open.
              </p>
            </form>
          ) : !inPaymentStep && !showMyaza && !showQuoteConfirm ? (
            <form className="card space-y-4" onSubmit={onGetQuote}>
              <h2 className="text-lg font-semibold">Shipping</h2>
              <p className="text-xs text-black/60">
                Placing the order <span className="font-medium">clears your cart</span>. You'll complete payment on the next step.
              </p>

              <label className="block space-y-1 text-sm">
                <span className="text-black/70">Full name</span>
                <input
                  className="input w-full"
                  name="fullName"
                  placeholder="Jane Doe"
                  required
                  defaultValue={me?.defaultShippingAddress?.fullName ?? ""}
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-black/70">Address line 1</span>
                <input
                  className="input w-full"
                  name="line1"
                  placeholder="Street, building, unit"
                  required
                  defaultValue={me?.defaultShippingAddress?.line1 ?? ""}
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-black/70">Address line 2 (optional)</span>
                <input
                  className="input w-full"
                  name="line2"
                  placeholder="Apt, suite, etc."
                  defaultValue={me?.defaultShippingAddress?.line2 ?? ""}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1 text-sm">
                  <span className="text-black/70">City</span>
                  <input
                    className="input w-full"
                    name="city"
                    placeholder="City"
                    required
                    defaultValue={me?.defaultShippingAddress?.city ?? ""}
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-black/70">State / region</span>
                  <input
                    className="input w-full"
                    name="state"
                    placeholder="State or region"
                    defaultValue={me?.defaultShippingAddress?.state ?? ""}
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block space-y-1 text-sm">
                  <span className="text-black/70">Country code</span>
                  <input
                    className="input w-full"
                    name="country"
                    placeholder="e.g. NG"
                    defaultValue={me?.defaultShippingAddress?.country ?? "NG"}
                  />
                </label>
                <label className="block space-y-1 text-sm">
                  <span className="text-black/70">Postal code</span>
                  <input
                    className="input w-full"
                    name="postalCode"
                    placeholder="Postal or ZIP"
                    defaultValue={me?.defaultShippingAddress?.postalCode ?? ""}
                  />
                </label>
              </div>
              <label className="block space-y-1 text-sm">
                <span className="text-black/70">Phone</span>
                <input
                  className="input w-full"
                  name="phone"
                  type="tel"
                  placeholder="+234 …"
                  defaultValue={me?.defaultShippingAddress?.phone ?? me?.phone ?? ""}
                />
              </label>

              <div className="border-t border-black/10 pt-4 space-y-3">
                <p className="text-sm font-medium">Delivery options</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1 text-sm">
                    <span className="text-black/70">Destination</span>
                    <select
                      className="input w-full"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value as LandedCostDestination)}
                    >
                      <option value="lagos">Lagos</option>
                      <option value="outside_lagos">Outside Lagos</option>
                    </select>
                  </label>
                  <label className="block space-y-1 text-sm">
                    <span className="text-black/70">Shipping service</span>
                    <select
                      className="input w-full"
                      value={shippingService}
                      onChange={(e) => setShippingService(e.target.value as LandedCostService)}
                    >
                      <option value="air">Air (faster)</option>
                      <option value="ocean_small">Ocean small box</option>
                    </select>
                  </label>
                </div>
                <label className="block space-y-1 text-sm">
                  <span className="text-black/70">Product category</span>
                  <select
                    className="input w-full"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as LandedCostCategory)}
                  >
                    <option value="generic">General / Other</option>
                    <option value="sneakers">Sneakers</option>
                    <option value="clothing">Clothing</option>
                    <option value="phone">Phone</option>
                    <option value="laptop">Laptop</option>
                    <option value="tablet">Tablet</option>
                    <option value="tv">TV</option>
                    <option value="electronics_small">Electronics (small)</option>
                    <option value="electronics_large">Electronics (large)</option>
                    <option value="accessories">Accessories</option>
                    <option value="books">Books</option>
                  </select>
                </label>
              </div>

              {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
              <button
                className="btn-primary w-full"
                type="submit"
                disabled={quoting || apiItems.length === 0 || loading}
              >
                {quoting ? "Getting estimate…" : "Get cost estimate"}
              </button>
            </form>
          ) : showQuoteConfirm && !inPaymentStep && !showMyaza ? (
            <div className="card space-y-4">
              <h2 className="text-lg font-semibold">Confirm your order</h2>
              <p className="text-xs text-black/60">
                Review the estimated landed cost below. Once you place the order, your cart is cleared.
              </p>
              {landedCostQuote ? (
                <div className="rounded-xl border border-black/10 bg-black/[0.02] p-4 space-y-2">
                  <p className="text-sm font-medium text-shop-ink">Estimated landed cost</p>
                  {landedCostQuote.marketplaceConfidence === "low" && (
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5">
                      Marketplace estimates are approximate. Final cost may vary slightly.
                    </p>
                  )}
                  <ul className="space-y-1 text-xs text-black/70 font-mono">
                    {landedCostQuote.breakdown.map((line, i) => (
                      <li key={i} className="whitespace-pre-wrap">{line}</li>
                    ))}
                  </ul>
                  {landedCostQuote.totalDisplay && landedCostQuote.displayCurrency && (
                    <p className="pt-2 text-sm font-semibold text-shop-ink border-t border-black/10">
                      Estimated total: {landedCostQuote.displayCurrency} {landedCostQuote.totalDisplay.toLocaleString()}
                    </p>
                  )}
                </div>
              ) : quoteError ? (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{quoteError}</p>
              ) : null}
              {phoneVerificationBlocked && (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  Verify your phone number via WhatsApp in{" "}
                  <Link href="/dashboard/settings" className="font-semibold underline">
                    Settings
                  </Link>{" "}
                  before checking out.
                </p>
              )}
              <div className="flex gap-3">
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => { setLandedCostQuote(null); setPendingFormData(null); setQuoteError(""); }}
                >
                  Back
                </button>
                <button
                  className="btn-primary flex-1"
                  type="button"
                  disabled={creating || placeOrderBusy || phoneVerificationBlocked}
                  onClick={onPlaceOrder}
                >
                  {creating || placeOrderBusy ? "Placing order…" : "Place order"}
                </button>
              </div>
              {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
            </div>
          ) : null}

          <section className="card h-fit">
            <h2 className="text-lg font-semibold">Summary</h2>
            {(inPaymentStep || showMyaza) && displayOrder ? (
              <>
                <p className="mt-2 text-sm font-medium text-shop-ink">Order total</p>
                <p className="mt-1 text-xs text-black/55">Totals are locked in from your order.</p>
                <ul className="mt-3 space-y-2 border-b border-black/10 pb-3 text-sm">
                  {displayOrder.items.map((item, idx) => (
                    <li key={`${item.title}-${idx}`} className="flex justify-between gap-2">
                      <span className="min-w-0 text-black/80">
                        {item.title} × {item.quantity}
                      </span>
                      <span className="shrink-0 font-medium tabular-nums text-shop-ink">
                        {formatApiMoney(
                          orderLineTotal(item as (typeof displayOrder.items)[number]),
                          item.currency
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 space-y-2 text-sm">
                  {displayOrder.displaySummary ? (
                    <CheckoutDisplaySummary summary={displayOrder.displaySummary} />
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span>Subtotal</span>
                        <span className="font-medium tabular-nums">{orderCurrency} {oSub.toFixed(2)}</span>
                      </div>
                      {oSvc > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-black/60">Service charge</span>
                          <span className="font-medium tabular-nums">{orderCurrency} {oSvc.toFixed(2)}</span>
                        </div>
                      )}
                      {oDisc > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-black/60">Discount</span>
                          <span className="font-medium tabular-nums text-emerald-600">-{orderCurrency} {oDisc.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between border-t border-black/10 pt-2 font-semibold">
                        <span>Total</span>
                        <span className="tabular-nums">{formatApiMoney(oTotal, displayOrder.currency ?? orderCurrency)}</span>
                      </div>
                    </>
                  )}
                  {displayOrder.pricingBreakdown && displayOrder.pricingBreakdown.length > 0 && (
                    <details className="border-t border-black/10 pt-2 text-xs text-black/50">
                      <summary className="cursor-pointer select-none hover:text-black/80">Cost breakdown</summary>
                      <ul className="mt-2 space-y-0.5 font-mono">
                        {displayOrder.pricingBreakdown.map((line, i) => (
                          <li key={i} className="whitespace-pre-wrap">{line}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-black/70">
                  {apiItems.length} {apiItems.length === 1 ? "item" : "items"} in your cart
                </p>
                {localItems.length > 0 ? (
                  <p className="mt-2 text-xs text-black/50">
                    {localItems.length} saved in your browser only
                  </p>
                ) : null}
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium tabular-nums">
                      {apiCurrency} {apiSubtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Service charge</span>
                    <span className="font-medium tabular-nums">
                      {apiCurrency} {apiServiceCharge.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Discount</span>
                    <span className="font-medium tabular-nums">
                      -{apiCurrency} {apiDiscount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fees</span>
                    <span className="font-medium tabular-nums">
                      {apiCurrency} {apiFees.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-black/10 pt-2 font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">
                      {apiCurrency} {apiTotal.toFixed(2)}
                    </span>
                  </div>
                  {localItems.length > 0 ? (
                    <div className="flex items-center justify-between border-t border-black/10 pt-2 text-xs text-black/50">
                      <span>On-device only</span>
                      <span className="tabular-nums">USD {localSubtotal.toFixed(2)}</span>
                    </div>
                  ) : null}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </InnerShell>
  );
}

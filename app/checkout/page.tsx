"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  useInitializePaymentMutation,
} from "@/store/routes/unified-commerce-api";
import type { OrderResponse, PaymentInitResponse, PaymentMethodEntry, PaymentProvider } from "@/types/api";
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
import { unifiedCommerceApi } from "@/store/routes/unified-commerce-api";

const PAYPAL_STORAGE = "uc_paypal_checkout";

const DEFAULT_METHODS: PaymentMethodEntry[] = [
  { provider: "paystack", available: true, reason: null },
  { provider: "stripe", available: true, reason: null },
  { provider: "paypal", available: true, reason: null },
  { provider: "myaza", available: true, reason: null },
];

function isPaymentProvider(p: string | undefined | null): p is PaymentProvider {
  return p === "paystack" || p === "stripe" || p === "paypal" || p === "myaza";
}

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.accessToken);
  const searchParams = useSearchParams();
  const { items: localItems, subtotal: localSubtotal } = useCart();
  const { data: me, isLoading: meLoading } = useGetMeQuery(undefined, { skip: !token });
  const { data: cart, isLoading: cartLoading, refetch: refetchCart } = useGetCartQuery(undefined, { skip: !token });
  const { data: paymentMethods, isLoading: methodsLoading, isError: methodsError } = useGetPaymentMethodsQuery();
  const [createOrder, { isLoading: creating, isError: createErr, error: createError }] = useCreateOrderMutation();
  const [initPayment, { isLoading: paying, isError: payErr, error: payError, reset: resetPayError }] =
    useInitializePaymentMutation();

  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [orderSnapshot, setOrderSnapshot] = useState<OrderResponse | null>(null);
  const [formError, setFormError] = useState("");
  const [payInitError, setPayInitError] = useState(false);
  const [provider, setProvider] = useState<PaymentProvider>("paystack");
  const [placeOrderBusy, setPlaceOrderBusy] = useState(false);
  const [myazaSession, setMyazaSession] = useState<Extract<PaymentInitResponse, { provider: "myaza" }> | null>(null);
  const [myazaOrderId, setMyazaOrderId] = useState<string | null>(null);
  const [addressCopied, setAddressCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: orderFetched, isLoading: orderLoading, refetch: refetchOrder } = useGetOrderQuery(activeOrderId ?? "", {
    skip: !token || !activeOrderId,
  });

  const displayOrder = orderFetched ?? orderSnapshot;

  const resumeParam = (searchParams.get("resume") ?? "").trim();
  const resumeId = resumeParam && isUuid(resumeParam) ? resumeParam : null;

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

  const onPlaceOrder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
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
    if (availableProviders.length > 0 && !availableProviders.includes(provider) && !methodsError) {
      setFormError("That payment method is not available right now. Choose another option.");
      return;
    }
    setPlaceOrderBusy(true);
    try {
      const order = await createOrder({
        shippingAddress: {
          fullName,
          line1,
          city,
          country,
          line2: String(fd.get("line2") ?? "").trim() || undefined,
          state: String(fd.get("state") ?? "").trim() || undefined,
          postalCode: String(fd.get("postalCode") ?? "").trim() || undefined,
          phone: String(fd.get("phone") ?? "").trim() || undefined,
        },
      }).unwrap();
      setOrderSnapshot(order);
      setActiveOrderId(order.id);
      setPendingCheckoutOrderId(order.id);
      setMyazaSession(null);
      setMyazaOrderId(null);
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

  const copyAddress = useCallback(() => {
    if (!myazaSession?.depositAddress) return;
    void navigator.clipboard.writeText(myazaSession.depositAddress).then(() => {
      setAddressCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setAddressCopied(false), 2000);
    });
  }, [myazaSession?.depositAddress]);

  const loading = meLoading || cartLoading || methodsLoading;
  const providerLabels: Record<PaymentProvider, string> = {
    paystack: "Paystack",
    stripe: "Stripe Checkout",
    paypal: "PayPal",
    myaza: "Myaza (crypto)",
  };

  if (!token) {
    return (
      <InnerShell>
        <div className="card max-w-lg space-y-4">
          <h1 className="text-xl font-semibold">Sign in to checkout</h1>
          <p className="text-sm text-black/70">
            Sign in to place an order and pay securely.
            {localItems.length > 0
              ? " Items in your browser cart aren’t kept after sign-in — add them again once you’re logged in."
              : null}
          </p>
          <Link href="/auth/login" className="btn-primary inline-block text-center">
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
                  ? "Your cart was converted to an order. Complete payment using the order total below (not the cart)."
                  : "Enter shipping, place the order, then pay."}
              </p>
            </div>
            <Steps
              current={1}
              steps={[
                { label: "Cart", href: inPaymentStep ? undefined : "/cart" },
                { label: "Checkout" },
                { label: "Success" },
              ]}
            />
          </div>
        </section>

        {loading && !inPaymentStep && <LoadingState label="Loading…" />}
        {createErr && <ErrorState error={createError} title="Order failed" />}
        {payErr && payInitError && <ErrorState error={payError} title="Payment init failed" />}

        {showMyaza && myazaOrderId ? (
          <section className="card overflow-hidden border-shop-accent/40 p-0">
            {/* Header */}
            <div className="bg-shop-accent/8 px-6 py-4 border-b border-shop-accent/20">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
                <h2 className="text-base font-semibold text-shop-ink">Awaiting crypto payment</h2>
              </div>
              <p className="mt-1 text-sm text-black/60">
                Send the exact amount to the address below. Payment confirms automatically.
              </p>
            </div>

            <div className="p-6">
              {myazaSession ? (
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  {/* QR code */}
                  {myazaSession.qrCode ? (
                    <div className="shrink-0">
                      <div className="relative h-40 w-40 rounded-xl border border-black/10 bg-white p-2 shadow-sm">
                        <Image src={myazaSession.qrCode} alt="Payment QR code" fill className="object-contain p-1" unoptimized />
                      </div>
                      <p className="mt-1.5 text-center text-xs text-black/40">Scan to pay</p>
                    </div>
                  ) : null}

                  {/* Details */}
                  <div className="min-w-0 flex-1 space-y-4">
                    {/* Network + Amount row */}
                    <div className="flex flex-wrap gap-3">
                      <div className="rounded-lg border border-black/10 bg-black/3 px-3 py-2">
                        <p className="text-xs text-black/50">Network</p>
                        <p className="mt-0.5 font-semibold text-sm">{myazaSession.chain}</p>
                      </div>
                      <div className="rounded-lg border border-black/10 bg-black/3 px-3 py-2">
                        <p className="text-xs text-black/50">Token</p>
                        <p className="mt-0.5 font-semibold text-sm">{myazaSession.token}</p>
                      </div>
                      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                        <p className="text-xs text-amber-700/70">Amount due</p>
                        <p className="mt-0.5 font-mono font-bold text-sm text-amber-800">{myazaSession.amount}</p>
                      </div>
                    </div>

                    {/* Wallet address */}
                    <div>
                      <p className="mb-1.5 text-xs font-medium text-black/50 uppercase tracking-wide">Deposit address</p>
                      <div className="flex items-center gap-2 rounded-lg border border-black/10 bg-black/3 px-3 py-2.5">
                        <p className="min-w-0 flex-1 break-all font-mono text-xs text-shop-ink">{myazaSession.depositAddress}</p>
                        <button
                          type="button"
                          onClick={copyAddress}
                          className="shrink-0 rounded-md border border-black/10 bg-white px-2.5 py-1 text-xs font-medium text-black/60 transition hover:border-shop-accent/50 hover:text-shop-accent active:scale-95"
                          aria-label="Copy wallet address"
                        >
                          {addressCopied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>

                    {/* Hosted checkout link */}
                    {myazaSession.checkoutUrl ? (
                      <a
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-shop-accent underline underline-offset-2 hover:opacity-80"
                        href={myazaSession.checkoutUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open Myaza hosted checkout
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer actions */}
            <div className="flex flex-wrap gap-2 border-t border-black/8 bg-black/2 px-6 py-4">
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
              <h2 className="text-lg font-semibold">Complete your payment</h2>
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
                <p className="text-xs text-black/50">Payment options couldn't load. All options are shown — try again if needed.</p>
              ) : null}
              <label className="block space-y-1 text-sm">
                <span className="text-black/70">Provider</span>
                <select
                  className="input w-full"
                  value={provider}
                  onChange={(e) => {
                    setProvider(e.target.value as PaymentProvider);
                    setPayInitError(false);
                    resetPayError();
                  }}
                  disabled={!methodsError && availableProviders.length === 0}
                >
                  {methodRows.map((m) => (
                    <option key={m.provider} value={m.provider} disabled={!m.available}>
                      {providerLabels[m.provider]}
                      {!m.available && m.reason ? ` — ${m.reason}` : ""}
                    </option>
                  ))}
                </select>
              </label>
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
                If payment setup failed, you can <span className="font-medium">retry</span> with the same or another
                provider. The order id stays the same.
              </p>
            </form>
          ) : !inPaymentStep && !showMyaza ? (
            <form className="card space-y-4" onSubmit={onPlaceOrder}>
              <h2 className="text-lg font-semibold">Shipping</h2>
              <p className="text-xs text-black/60">
                Placing the order <span className="font-medium">moves</span> line items out of your cart. You will pay on the
                next step.
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
              {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
              <button
                className="btn-primary w-full"
                type="submit"
                disabled={creating || placeOrderBusy || apiItems.length === 0 || loading}
              >
                {creating || placeOrderBusy ? "Placing order…" : "Place order"}
              </button>
            </form>
          ) : null}

          <section className="card h-fit">
            <h2 className="text-lg font-semibold">Summary</h2>
            {inPaymentStep && displayOrder ? (
              <>
                <p className="mt-2 text-xs text-black/55">Your order total — this is what you'll pay.</p>
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
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium tabular-nums">
                      {orderCurrency} {oSub.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Service charge</span>
                    <span className="font-medium tabular-nums">
                      {orderCurrency} {oSvc.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Discount</span>
                    <span className="font-medium tabular-nums">
                      -{orderCurrency} {oDisc.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fees</span>
                    <span className="font-medium tabular-nums">
                      {orderCurrency} {oFees.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-black/10 pt-2 font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums">{formatApiMoney(oTotal, displayOrder.currency ?? orderCurrency)}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-black/70">
                  {apiItems.length} {apiItems.length === 1 ? "item" : "items"} in your cart
                </p>
                {localItems.length > 0 ? (
                  <p className="mt-2 text-xs text-black/50">
                    {localItems.length} on-device only — not in server cart
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

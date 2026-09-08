"use client";

import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  Check,
  RefreshCw,
  AlertCircle,
  Copy,
  Package,
  MapPin,
  CreditCard,
  ArrowRight,
  ShoppingBag,
  Clock,
  Printer,
  ShieldCheck,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { InnerShell } from "@/components/layout/inner-shell";
import { useAppSelector } from "@/store/hooks";
import { useGetOrderQuery, useVerifyPaymentMutation } from "@/store/routes/unified-commerce-api";
import { ErrorState } from "@/components/feedback/query-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { isUuid } from "@/lib/uuid";
import { useOrderRealtime } from "@/hooks/use-order-realtime";
import { clearPendingCheckoutOrderId } from "@/lib/pending-checkout-order";
import { formatApiMoney } from "@/lib/format-price";
import { orderLineTotal, orderTotal } from "@/lib/dashboard-orders";
import type { OrderDisplaySummary } from "@/types/api";

function OrderTotalsSummary({
  summary,
  fallbackAmount,
  fallbackCurrency,
}: {
  summary?: OrderDisplaySummary;
  fallbackAmount: number;
  fallbackCurrency: string;
}) {
  if (summary) {
    const cur = summary.currency;
    return (
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between text-shop-muted">
          <span>Items subtotal</span>
          <span className="font-medium text-shop-ink">{formatApiMoney(Number(summary.product), cur)}</span>
        </div>
        <div className="flex justify-between text-shop-muted">
          <span>Import &amp; delivery</span>
          <span className="font-medium text-shop-ink">{formatApiMoney(Number(summary.importAndDelivery), cur)}</span>
        </div>
        <div className="flex justify-between text-shop-muted">
          <span>Service charge</span>
          <span className="font-medium text-shop-ink">{formatApiMoney(Number(summary.serviceFee), cur)}</span>
        </div>
        {Number(summary.discount) > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Special discount</span>
            <span className="font-medium">−{formatApiMoney(Number(summary.discount), cur)}</span>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-shop-border pt-3">
          <span className="text-base font-semibold text-shop-ink">Total paid</span>
          <span className="text-xl font-bold tracking-tight text-shop-ink">
            {formatApiMoney(Number(summary.total), cur)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-baseline justify-between border-t border-shop-border pt-3">
      <span className="text-base font-semibold text-shop-ink">Total</span>
      <span className="text-xl font-bold tracking-tight text-shop-ink">
        {formatApiMoney(fallbackAmount, fallbackCurrency)}
      </span>
    </div>
  );
}

export function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const token = useAppSelector((s) => s.auth.accessToken);
  const userEmail = useAppSelector((s) => s.auth.email);

  const [copied, setCopied] = useState(false);

  const orderId = useMemo(() => {
    const a = searchParams.get("order_id");
    const b = searchParams.get("order");
    const raw = a ?? b ?? "";
    return raw.trim();
  }, [searchParams]);

  /** Stripe Checkout replaces `{CHECKOUT_SESSION_ID}` in the success URL. */
  const stripeSessionId = useMemo(() => searchParams.get("session_id")?.trim() ?? "", [searchParams]);
  const paystackReference = useMemo(() => searchParams.get("reference")?.trim() ?? "", [searchParams]);

  const validId = orderId && isUuid(orderId);

  const { data: order, isLoading, isError, error, refetch } = useGetOrderQuery(orderId, {
    skip: !token || !validId,
    pollingInterval: 3000,
  });

  const [verifyPayment, { isLoading: verifying }] = useVerifyPaymentMutation();
  const verifyAttempted = useRef(false);
  const [waitingTimeout, setWaitingTimeout] = useState(false);

  // Automatically attempt verification with provider when returning with session/ref or pending order
  useEffect(() => {
    if (!token || !validId || verifyAttempted.current) return;
    if (order && order.status === "PAID") return;

    verifyAttempted.current = true;
    verifyPayment({
      orderId,
      sessionId: stripeSessionId || undefined,
      reference: paystackReference || undefined,
    })
      .unwrap()
      .then(() => {
        void refetch();
      })
      .catch(() => {
        // Fallback to polling
      });
  }, [token, validId, order, orderId, stripeSessionId, paystackReference, verifyPayment, refetch]);

  // Timeout guard after 12s if order is still PENDING
  useEffect(() => {
    if (order && order.status === "PAID") {
      setWaitingTimeout(false);
      return;
    }
    const timer = setTimeout(() => {
      if (order && order.status !== "PAID") {
        setWaitingTimeout(true);
      }
    }, 12000);
    return () => clearTimeout(timer);
  }, [order]);

  useOrderRealtime(token, (event) => {
    if (event.orderId === orderId) {
      void refetch();
    }
  });

  useEffect(() => {
    if (!order) return;
    if (order.status === "PAID") {
      clearPendingCheckoutOrderId();
    }
  }, [order]);

  const onManualVerify = async () => {
    setWaitingTimeout(false);
    try {
      await verifyPayment({
        orderId,
        sessionId: stripeSessionId || undefined,
        reference: paystackReference || undefined,
      }).unwrap();
      void refetch();
    } catch {
      void refetch();
    }
  };

  const handleCopyId = async () => {
    if (!orderId) return;
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      toast.success("Order ID copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy Order ID");
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // 1. Unauthenticated state
  if (!token) {
    return (
      <InnerShell>
        <div className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center py-8 text-center">
          <div className="card w-full space-y-6 p-8 sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-shop-ink">Payment Complete</h1>
              <p className="text-sm text-shop-muted leading-relaxed">
                Your checkout is completed. Sign in to your account to view your order receipt, live tracking, and shipping updates.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/auth/login" className="btn-primary inline-flex items-center justify-center gap-2 w-full py-3">
                Sign in to view order
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </InnerShell>
    );
  }

  // 2. Missing order ID
  if (!orderId) {
    return (
      <InnerShell>
        <div className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center py-8 text-center">
          <div className="card w-full space-y-6 p-8 sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-shop-ink">Order Confirmation</h1>
              <p className="text-sm text-shop-muted leading-relaxed">
                We couldn’t find an order reference in this link. You can open your dashboard to find recent purchases or continue shopping.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/dashboard/orders" className="btn-primary flex-1 inline-flex items-center justify-center gap-2 py-3">
                View my orders
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/" className="btn-secondary flex-1 inline-flex items-center justify-center gap-2 py-3">
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      </InnerShell>
    );
  }

  // 3. Invalid order ID format
  if (!validId) {
    return (
      <InnerShell>
        <div className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center py-8 text-center">
          <div className="card w-full space-y-6 p-8 sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/50">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-shop-ink">Invalid Order Link</h1>
              <p className="text-sm text-shop-muted leading-relaxed">
                This order reference link is invalid. Check your confirmation email or return to your account dashboard.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href="/dashboard/orders" className="btn-primary flex-1 inline-flex items-center justify-center gap-2 py-3">
                Go to my orders
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/" className="btn-secondary flex-1 inline-flex items-center justify-center gap-2 py-3">
                Return to shop
              </Link>
            </div>
          </div>
        </div>
      </InnerShell>
    );
  }

  // 4. Loading state
  if (isLoading && !order) {
    return (
      <InnerShell>
        <div className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center py-8 text-center">
          <div className="card w-full space-y-4 p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-shop-accent-soft text-shop-primary">
              <RefreshCw className="h-7 w-7 animate-spin" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-shop-ink">Loading order details…</h2>
              <p className="text-xs text-shop-muted">Connecting with payment processor</p>
            </div>
          </div>
        </div>
      </InnerShell>
    );
  }

  // 5. Error state
  if (isError || !order) {
    return (
      <InnerShell>
        <div className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center py-8 text-center">
          <div className="card w-full space-y-6 p-8 sm:p-10">
            <ErrorState error={error} title="Could not load order details" />
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => void refetch()}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2 py-3 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Retry loading
              </button>
              <Link href="/dashboard/orders" className="btn-secondary flex-1 inline-flex items-center justify-center gap-2 py-3">
                View orders
              </Link>
            </div>
          </div>
        </div>
      </InnerShell>
    );
  }

  const paid = order.status === "PAID";
  const { amount, currency } = order.displaySummary
    ? { amount: Number(order.displaySummary.total), currency: order.displaySummary.currency }
    : orderTotal(order);

  const customerEmail = order.userEmail || userEmail;

  return (
    <InnerShell>
      <div className="mx-auto max-w-2xl py-4 sm:py-8">
        {/* Main Centered Card */}
        <div className="card overflow-hidden p-6 sm:p-10 space-y-8">
          
          {/* Header & Celebration Zone */}
          <div className="text-center space-y-4">
            {paid ? (
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-20 duration-1000" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-xl shadow-emerald-500/25 ring-8 ring-emerald-50">
                  <Check className="h-10 w-10 stroke-[2.5]" aria-hidden />
                </div>
              </div>
            ) : waitingTimeout ? (
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-500 text-white shadow-xl shadow-amber-500/25 ring-8 ring-amber-50">
                <AlertCircle className="h-10 w-10 stroke-[2.5]" aria-hidden />
              </div>
            ) : (
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
                <RefreshCw className="h-9 w-9 animate-spin stroke-[2.2]" aria-hidden />
              </div>
            )}

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3.5 py-1 text-xs font-semibold text-emerald-800">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                {paid ? "Payment Successful" : "Order Placed"}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-shop-ink">
                {paid
                  ? "Thank you for your order!"
                  : waitingTimeout
                  ? "Confirming your payment…"
                  : "Processing your order…"}
              </h1>

              <p className="mx-auto max-w-md text-sm text-shop-muted leading-relaxed">
                {paid ? (
                  <>
                    We’ve received your order and are preparing it for fulfillment.
                    {customerEmail ? (
                      <> A confirmation email was sent to <strong className="font-semibold text-shop-ink">{customerEmail}</strong>.</>
                    ) : (
                      " You can track its live progress anytime from your account."
                    )}
                  </>
                ) : waitingTimeout ? (
                  "Your payment provider is taking a moment to finalize the transaction. This screen will refresh automatically once confirmed."
                ) : (
                  "We're confirming your transaction with the payment provider. This usually takes just a few seconds."
                )}
              </p>
            </div>

            {/* Order Reference Badge & Copy Action */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <div className="inline-flex items-center gap-2 rounded-xl border border-shop-border bg-(--background) px-3.5 py-1.5 text-xs text-shop-ink">
                <span className="text-shop-muted">Order ID:</span>
                <span className="font-mono font-medium">{order.id}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  title="Copy Order ID"
                  className="ml-1 inline-flex items-center text-shop-muted hover:text-shop-ink transition cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>

              <StatusBadge status={order.status} />
            </div>
          </div>

          {/* Pending / Verification Notice (if still processing) */}
          {!paid && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 text-center sm:text-left space-y-3">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-amber-900">Payment verification in progress</p>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    If your bank or card was already charged, your order status will automatically switch to <strong>Paid</strong> once the provider confirmation arrives.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={onManualVerify}
                  disabled={verifying}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50 transition cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${verifying ? "animate-spin" : ""}`} />
                  {verifying ? "Checking status…" : "Check status now"}
                </button>
                <Link
                  href={`/checkout?resume=${order.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-4 py-2 text-xs font-medium text-amber-800 hover:bg-amber-50 transition"
                >
                  Resume payment
                </Link>
              </div>
            </div>
          )}

          {/* Fulfilment Journey Step Mini-Tracker */}
          <div className="rounded-2xl border border-shop-border bg-(--background) p-5 sm:p-6">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-shop-muted">
              Fulfilment Journey
            </h2>
            <div className="grid grid-cols-4 gap-2 text-center">
              {/* Step 1 */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xs">
                  <Check className="h-4 w-4 stroke-[3]" />
                </div>
                <span className="text-[11px] font-semibold text-shop-ink">Placed</span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                    paid
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "border-2 border-shop-primary bg-white text-shop-primary ring-4 ring-emerald-100"
                  }`}
                >
                  {paid ? <Check className="h-4 w-4 stroke-[3]" /> : <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                </div>
                <span className={`text-[11px] ${paid ? "font-semibold text-shop-ink" : "font-medium text-shop-muted"}`}>
                  Payment
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-shop-border text-xs font-medium text-shop-muted">
                  3
                </div>
                <span className="text-[11px] font-medium text-shop-muted">Processing</span>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-shop-border text-xs font-medium text-shop-muted">
                  4
                </div>
                <span className="text-[11px] font-medium text-shop-muted">Delivered</span>
              </div>
            </div>
          </div>

          {/* Order Summary & Items List */}
          <div className="rounded-2xl border border-shop-border bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-shop-border bg-(--background)/50 px-5 py-3.5 sm:px-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-shop-ink">
                <Package className="h-4 w-4 text-shop-muted" />
                Items ordered ({order.items.length})
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-shop-muted hover:text-shop-ink transition cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" />
                Print receipt
              </button>
            </div>

            {/* Item list */}
            <ul className="divide-y divide-shop-border">
              {order.items.map((item, idx) => {
                const lineTotal = orderLineTotal(item);
                return (
                  <li key={`${item.title}-${idx}`} className="flex items-center gap-4 p-4 sm:p-5">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-shop-border/70 bg-(--background)">
                      {item.images?.[0] ? (
                        <Image
                          src={item.images[0]}
                          alt={item.title}
                          fill
                          className="object-contain p-1.5"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-shop-muted/40">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="font-medium text-sm text-shop-ink line-clamp-2 leading-snug">
                        {item.title}
                      </p>
                      <p className="text-xs text-shop-muted">
                        Qty: <span className="font-medium text-shop-ink">{item.quantity}</span> &times; {formatApiMoney(item.price, item.currency)}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold tabular-nums text-shop-ink">
                        {formatApiMoney(lineTotal, item.currency)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Totals Breakdown */}
            <div className="border-t border-shop-border bg-(--background)/30 p-5 sm:p-6">
              <OrderTotalsSummary
                summary={order.displaySummary}
                fallbackAmount={amount}
                fallbackCurrency={currency}
              />
            </div>
          </div>

          {/* Details Grid (Delivery & Payment info) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Delivery Address */}
            <div className="rounded-2xl border border-shop-border bg-white p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-shop-muted">
                <MapPin className="h-4 w-4 text-shop-muted" />
                Shipping Details
              </div>
              {order.shippingAddress ? (
                <address className="text-xs not-italic leading-relaxed text-shop-ink">
                  <div className="font-medium text-sm">
                    {[order.shippingAddress.line1, order.shippingAddress.line2].filter(Boolean).join(", ")}
                  </div>
                  <div className="text-shop-muted mt-0.5">
                    {[
                      order.shippingAddress.city,
                      order.shippingAddress.state,
                      order.shippingAddress.postalCode,
                      order.shippingAddress.country,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </address>
              ) : (
                <p className="text-xs text-shop-muted">Standard delivery to your registered address.</p>
              )}
            </div>

            {/* Payment Method Details */}
            <div className="rounded-2xl border border-shop-border bg-white p-5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-shop-muted">
                <CreditCard className="h-4 w-4 text-shop-muted" />
                Payment Method
              </div>
              <div className="text-xs space-y-1 text-shop-ink">
                <div className="flex items-center gap-1.5 font-medium text-sm capitalize">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  {order.payment?.provider || "Card / Electronic Payment"}
                </div>
                {stripeSessionId && (
                  <p className="text-[11px] text-shop-muted truncate font-mono">
                    Ref: {stripeSessionId.slice(0, 24)}…
                  </p>
                )}
                <p className="text-[11px] text-emerald-700 font-medium">
                  {paid ? "Authorized and settled securely" : "Awaiting provider settlement"}
                </p>
              </div>
            </div>
          </div>

          {/* Primary & Secondary Call to Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/dashboard/orders/${order.id}`}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2 py-3 text-center"
              >
                Track order in dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="btn-secondary flex-1 inline-flex items-center justify-center gap-2 py-3 text-center"
              >
                <ShoppingBag className="h-4 w-4 text-shop-muted" />
                Continue shopping
              </Link>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/contact"
                className="inline-flex items-center gap-1 text-xs text-shop-muted hover:text-shop-ink transition"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                Have questions about your order? Contact our support team
              </Link>
            </div>
          </div>

        </div>
      </div>
    </InnerShell>
  );
}

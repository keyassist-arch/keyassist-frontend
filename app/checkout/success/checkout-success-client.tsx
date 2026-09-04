"use client";

import Link from "next/link";
import { CheckCircle2, RefreshCw, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { InnerShell } from "@/components/layout/inner-shell";
import { useAppSelector } from "@/store/hooks";
import { useGetOrderQuery, useVerifyPaymentMutation } from "@/store/routes/unified-commerce-api";
import { ErrorState, LoadingState, SuccessState } from "@/components/feedback/query-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { isUuid } from "@/lib/uuid";
import { useOrderRealtime } from "@/hooks/use-order-realtime";
import { clearPendingCheckoutOrderId } from "@/lib/pending-checkout-order";

export function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  const token = useAppSelector((s) => s.auth.accessToken);

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

  // Timeout guard after 15s if order is still PENDING
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

  if (!token) {
    return (
      <InnerShell>
        <section className="card max-w-2xl">
          <h1 className="text-2xl font-semibold">Payment complete</h1>
          <p className="mt-2 text-sm text-black/70">Sign in to view your order and confirmation details.</p>
          <Link href="/auth/login" className="btn-primary mt-4 inline-block">
            Sign in
          </Link>
        </section>
      </InnerShell>
    );
  }

  if (!orderId) {
    return (
      <InnerShell>
        <section className="card max-w-2xl">
          <h1 className="text-2xl font-semibold">Order confirmed</h1>
          <p className="mt-2 text-sm text-black/70">
            We don’t have an order reference in this link. Open your account to find recent orders, or return to the shop if you need to try again.
          </p>
          <Link href="/dashboard" className="btn-primary mt-4 inline-block">
            View orders
          </Link>
        </section>
      </InnerShell>
    );
  }

  if (!validId) {
    return (
      <InnerShell>
        <section className="card max-w-2xl">
          <ErrorState error="This order link doesn’t look valid. Check your email or open your account for the right link." title="Invalid link" />
          <Link href="/dashboard" className="btn-secondary mt-4 inline-block">
            Dashboard
          </Link>
        </section>
      </InnerShell>
    );
  }

  if (isLoading && !order) {
    return (
      <InnerShell>
        <LoadingState label="Loading order…" />
      </InnerShell>
    );
  }

  if (isError || !order) {
    return (
      <InnerShell>
        <ErrorState error={error} title="Could not load order" />
        <Link href="/dashboard" className="btn-secondary mt-4 inline-block">
          Dashboard
        </Link>
      </InnerShell>
    );
  }

  const paid = order.status === "PAID";

  return (
    <InnerShell>
      <section className="card max-w-2xl space-y-4">
        {paid ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" aria-hidden />
          </div>
        ) : waitingTimeout ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-200 bg-amber-50">
            <AlertCircle className="h-6 w-6 text-amber-600" aria-hidden />
          </div>
        ) : null}

        <p className="text-xs uppercase tracking-[0.14em] text-shop-accent">Order</p>
        <h1 className="text-3xl font-semibold">
          {paid
            ? "Payment confirmed"
            : waitingTimeout
            ? "Payment is processing"
            : "Waiting for payment"}
        </h1>

        <p className="text-sm text-black/70">
          {paid
            ? "Payment is confirmed. You can track fulfillment from your account."
            : waitingTimeout
            ? "Your payment provider is taking a moment to confirm the transaction. You can check the status again below or open your orders."
            : "Your payment provider is confirming the transaction — this page updates automatically."}
        </p>

        {paid ? (
          <SuccessState message="Payment received" />
        ) : waitingTimeout ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
            <p className="text-sm font-medium text-amber-900">Confirmation in progress</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              If your card or bank was charged, your order will update to Paid as soon as the provider sends the completion notice.
            </p>
            <button
              type="button"
              onClick={onManualVerify}
              disabled={verifying}
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${verifying ? "animate-spin" : ""}`} />
              {verifying ? "Checking…" : "Check status now"}
            </button>
          </div>
        ) : (
          <LoadingState label="Checking payment status…" />
        )}

        <div className="grid gap-2 text-sm border-t border-black/10 pt-3">
          <p>
            <span className="font-semibold">Order:</span>{" "}
            <span className="break-all text-xs tabular-nums text-black/80">{order.id}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">Status:</span>
            <StatusBadge status={order.status} />
          </div>
          {order.payment?.provider ? (
            <p>
              <span className="font-semibold">Provider:</span> {order.payment.provider}
            </p>
          ) : null}
          {stripeSessionId ? (
            <p className="text-xs text-black/50">
              <span className="font-semibold text-black/70">Payment reference:</span>{" "}
              <span className="break-all font-mono">{stripeSessionId}</span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Link href="/dashboard/orders" className="btn-primary">
            View my orders
          </Link>
          {!paid && (
            <Link href={`/checkout?resume=${order.id}`} className="btn-secondary">
              Back to checkout
            </Link>
          )}
          <Link href="/" className="btn-secondary">
            Continue shopping
          </Link>
        </div>
      </section>
    </InnerShell>
  );
}

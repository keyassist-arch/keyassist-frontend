"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { InnerShell } from "@/components/layout/inner-shell";
import { useAppSelector } from "@/store/hooks";
import { useGetOrderQuery } from "@/store/routes/unified-commerce-api";
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

  const validId = orderId && isUuid(orderId);

  const { data: order, isLoading, isError, error, refetch } = useGetOrderQuery(orderId, {
    skip: !token || !validId,
    pollingInterval: 3000,
  });

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

  if (!token) {
    return (
      <InnerShell>
        <section className="card max-w-2xl">
          <h1 className="text-2xl font-semibold">Payment return</h1>
          <p className="mt-2 text-sm text-black/70">Sign in to see your order status and confirmation details.</p>
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
        <p className="text-xs uppercase tracking-[0.14em] text-shop-accent">Order</p>
        <h1 className="text-3xl font-semibold">{paid ? "Payment confirmed" : "Waiting for payment"}</h1>
        <p className="text-sm text-black/70">
          {paid
            ? "Payment is confirmed. You can track fulfillment from your account."
            : "Your bank may take a moment to confirm payment — this page updates automatically."}
        </p>
        {paid ? <SuccessState message="Payment received" /> : <LoadingState label="Checking payment status…" />}
        <div className="grid gap-2 text-sm">
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
              <span className="font-semibold text-black/70">Checkout session:</span>{" "}
              <span className="break-all font-mono">{stripeSessionId}</span>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard" className="btn-primary">
            Account
          </Link>
          <Link href="/" className="btn-secondary">
            Continue shopping
          </Link>
        </div>
      </section>
    </InnerShell>
  );
}

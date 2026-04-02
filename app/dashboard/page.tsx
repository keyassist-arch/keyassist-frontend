"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, CheckCircle2, Package, Truck, Wallet } from "lucide-react";
import { OrderCard } from "@/components/dashboard/order-card";
import { ErrorState, LoadingState } from "@/components/feedback/query-state";
import { formatApiMoney } from "@/lib/format-price";
import { isActiveOrderStatus, orderTotal, sortOrdersNewestFirst } from "@/lib/dashboard-orders";
import { useGetMeQuery, useGetOrdersQuery } from "@/store/routes/unified-commerce-api";
import { useAppSelector } from "@/store/hooks";

export default function DashboardHomePage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: me, isLoading: meLoading, isError: meErr, error: meError } = useGetMeQuery(undefined, {
    skip: !token,
  });
  const { data: orders, isLoading: ordLoading, isError: ordErr, error: ordError } = useGetOrdersQuery(undefined, {
    skip: !token,
  });

  const sorted = useMemo(() => (orders ? sortOrdersNewestFirst(orders) : []), [orders]);

  const metrics = useMemo(() => {
    if (!orders?.length) {
      return { totalOrders: 0, active: 0, delivered: 0, spent: 0, currency: "USD" };
    }
    let active = 0;
    let delivered = 0;
    let spent = 0;
    let currency = "USD";
    for (const o of orders) {
      if (isActiveOrderStatus(o.status)) active += 1;
      if (o.status === "DELIVERED") delivered += 1;
      const t = orderTotal(o);
      spent += t.amount;
      currency = t.currency;
    }
    return {
      totalOrders: orders.length,
      active,
      delivered,
      spent,
      currency,
    };
  }, [orders]);

  const recent = useMemo(() => sorted.slice(0, 5), [sorted]);

  if (meLoading || ordLoading) {
    return <LoadingState label="Loading your dashboard…" />;
  }

  if (meErr || ordErr) {
    return (
      <div className="space-y-4">
        {meErr ? <ErrorState error={meError} title="Could not load profile" /> : null}
        {ordErr ? <ErrorState error={ordError} title="Could not load orders" /> : null}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-shop-ink">Overview</h1>
        <p className="mt-1 text-sm text-black/70">
          Signed in as <span className="font-medium text-shop-ink">{me?.email}</span>
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="card flex flex-col gap-0 border-shop-border/80 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-black/45">All orders</span>
            <Package className="h-5 w-5 text-shop-accent" aria-hidden />
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-shop-ink">{metrics.totalOrders}</p>
          <p className="mt-1 text-sm text-black/70">Lifetime orders placed</p>
        </article>
        <article className="card flex flex-col gap-0 border-shop-border/80 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-black/45">In progress</span>
            <Truck className="h-5 w-5 text-shop-accent" aria-hidden />
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-shop-ink">{metrics.active}</p>
          <p className="mt-1 text-sm text-black/70">Active or shipping</p>
        </article>
        <article className="card flex flex-col gap-0 border-shop-border/80 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-black/45">Delivered</span>
            <CheckCircle2 className="h-5 w-5 text-shop-accent" aria-hidden />
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-shop-ink">{metrics.delivered}</p>
          <p className="mt-1 text-sm text-black/70">Completed deliveries</p>
        </article>
        <article className="card flex flex-col gap-0 border-shop-border/80 p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-black/45">Order value</span>
            <Wallet className="h-5 w-5 text-shop-accent" aria-hidden />
          </div>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-shop-ink">
            {formatApiMoney(metrics.spent, metrics.currency)}
          </p>
          <p className="mt-1 text-sm text-black/70">Sum of order totals</p>
        </article>
      </section>

      <section className="card border-shop-border/80">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
          <h2 className="text-lg font-semibold text-shop-ink">Recent orders</h2>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1 text-sm font-medium text-shop-accent hover:underline"
          >
            View all
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-6 text-sm text-black/70">No orders yet. Browse the shop and check out when you&apos;re ready.</p>
        ) : (
          <ul className="mt-2 space-y-3 pt-2">
            {recent.map((order) => (
              <li key={order.id}>
                <OrderCard order={order} href={`/dashboard/orders/${order.id}`} compact />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

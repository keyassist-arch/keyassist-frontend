"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, CheckCircle2, Package, ShoppingBag, Truck, Wallet } from "lucide-react";
import { OrderCard } from "@/components/dashboard/order-card";
import { DashboardHomeSkeleton } from "@/components/dashboard/dashboard-home-skeleton";
import { ErrorState } from "@/components/feedback/query-state";
import { formatApiMoney } from "@/lib/format-price";
import { isActiveOrderStatus, orderTotal, sortOrdersNewestFirst } from "@/lib/dashboard-orders";
import { useGetMeQuery, useGetOrdersQuery } from "@/store/routes/unified-commerce-api";
import { useAppSelector } from "@/store/hooks";

const METRICS = (m: { totalOrders: number; active: number; delivered: number; spent: number; currency: string }) => [
  {
    label: "Total orders",
    value: String(m.totalOrders),
    sub: "Lifetime orders placed",
    Icon: Package,
    bg: "rgba(28,25,23,0.06)",
    color: "#44403c",
  },
  {
    label: "In progress",
    value: String(m.active),
    sub: "Active or shipping",
    Icon: Truck,
    bg: "rgba(245,158,11,0.1)",
    color: "#d97706",
  },
  {
    label: "Delivered",
    value: String(m.delivered),
    sub: "Completed deliveries",
    Icon: CheckCircle2,
    bg: "rgba(16,185,129,0.1)",
    color: "#059669",
  },
  {
    label: "Order value",
    value: formatApiMoney(m.spent, m.currency),
    sub: "Sum of order totals",
    Icon: Wallet,
    bg: "rgba(37,99,235,0.08)",
    color: "#2563eb",
  },
];

export default function DashboardHomePage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: me, isLoading: meLoading, isError: meErr, error: meError } = useGetMeQuery(undefined, { skip: !token });
  const { data: orders, isLoading: ordLoading, isError: ordErr, error: ordError } = useGetOrdersQuery(undefined, { skip: !token });

  const sorted = useMemo(() => (orders ? sortOrdersNewestFirst(orders) : []), [orders]);

  const metrics = useMemo(() => {
    if (!orders?.length) return { totalOrders: 0, active: 0, delivered: 0, spent: 0, currency: "USD" };
    let active = 0, delivered = 0, spent = 0, currency = "USD";
    for (const o of orders) {
      if (isActiveOrderStatus(o.status)) active++;
      if (o.status === "DELIVERED") delivered++;
      const t = orderTotal(o);
      spent += t.amount;
      currency = t.currency;
    }
    return { totalOrders: orders.length, active, delivered, spent, currency };
  }, [orders]);

  const recent = useMemo(() => sorted.slice(0, 5), [sorted]);

  if (meLoading || ordLoading) return <DashboardHomeSkeleton />;

  if (meErr || ordErr) {
    return (
      <div className="space-y-4">
        {meErr ? <ErrorState error={meError} title="Could not load profile" /> : null}
        {ordErr ? <ErrorState error={ordError} title="Could not load orders" /> : null}
      </div>
    );
  }

  const firstName = me?.firstName?.trim();
  const metricCards = METRICS(metrics);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            {firstName ? `Hey, ${firstName} 👋` : "Overview"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s a snapshot of your account activity.
          </p>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#059669]/40 hover:text-[#059669]"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden />
          Browse shop
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((m) => (
          <article key={m.label} className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{m.label}</p>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: m.bg }}
              >
                <m.Icon className="h-[18px] w-[18px]" style={{ color: m.color }} aria-hidden />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold tabular-nums text-gray-900">{m.value}</p>
            <p className="mt-1 text-xs text-gray-400">{m.sub}</p>
          </article>
        ))}
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border border-black/[0.06] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-black/[0.06] px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Recent orders</h2>
            <p className="mt-0.5 text-xs text-gray-400">Your 5 most recent purchases</p>
          </div>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#059669] transition hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <div className="p-4">
          {recent.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/10 bg-gray-50/60 py-10 text-center">
              <Package className="mx-auto h-8 w-8 text-gray-300" aria-hidden />
              <p className="mt-3 text-sm font-medium text-gray-500">No orders yet</p>
              <p className="mt-1 text-xs text-gray-400">Your orders will show up here once you place one.</p>
              <Link
                href="/shop"
                className="mt-4 inline-flex items-center gap-1 rounded-full bg-[#059669] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#047857]"
              >
                Start shopping <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {recent.map((order) => (
                <li key={order.id}>
                  <OrderCard order={order} href={`/dashboard/orders/${order.id}`} compact />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

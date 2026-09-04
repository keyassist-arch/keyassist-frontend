"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { ArrowRight, CheckCircle2, ChevronRight, Package, Truck } from "lucide-react";
import { useGetAdminOrdersQuery, useGetAdminProductsQuery, useGetMeQuery } from "@/store/routes/unified-commerce-api";
import { useAppSelector } from "@/store/hooks";
import { AdminOverviewSkeleton } from "@/components/dashboard/admin-overview-skeleton";
import { ErrorState } from "@/components/feedback/query-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatApiMoney } from "@/lib/format-price";
import { isActiveOrderStatus, orderTotal, sortOrdersNewestFirst } from "@/lib/dashboard-orders";
import { ADMIN_NAV, canSeeAdminSection } from "@/lib/admin-nav";

export default function AdminOverviewPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: me } = useGetMeQuery(undefined, { skip: !token });
  const { data: adminOrders, isLoading: ordLoading, isError: ordErr, error: ordError } = useGetAdminOrdersQuery(undefined, { skip: !token });
  const { data: adminProducts, isLoading: prodLoading, isError: prodErr, error: prodError } = useGetAdminProductsQuery(undefined, { skip: !token });

  const isAdmin = me?.role === "ADMIN_SUPER" || me?.role === "ADMIN_STAFF";
  const loading = ordLoading || prodLoading;

  const sorted = useMemo(() => (adminOrders ? sortOrdersNewestFirst(adminOrders) : []), [adminOrders]);
  const recent = useMemo(() => sorted.slice(0, 5), [sorted]);

  const metrics = useMemo(() => {
    if (!adminOrders?.length) return { total: 0, active: 0, delivered: 0 };
    let active = 0, delivered = 0;
    for (const o of adminOrders) {
      if (isActiveOrderStatus(o.status)) active++;
      if (o.status === "DELIVERED") delivered++;
    }
    return { total: adminOrders.length, active, delivered };
  }, [adminOrders]);

  const quickLinks = useMemo(
    () => ADMIN_NAV.filter((item) => item.href !== "/admin" && canSeeAdminSection(me, item.permission)),
    [me],
  );

  if (!isAdmin) return null;

  if (loading) return <AdminOverviewSkeleton />;

  const metricCards = [
    { label: "Total orders", value: String(metrics.total), sub: "All-time orders", Icon: Package, bg: "rgba(28,25,23,0.06)", color: "#44403c" },
    { label: "Needs attention", value: String(metrics.active), sub: "Active or shipping", Icon: Truck, bg: "rgba(245,158,11,0.1)", color: "#d97706" },
    { label: "Delivered", value: String(metrics.delivered), sub: "Completed deliveries", Icon: CheckCircle2, bg: "rgba(16,185,129,0.1)", color: "#059669" },
    { label: "Catalog items", value: String(adminProducts?.length ?? 0), sub: "Products live in shop", Icon: Package, bg: "rgba(37,99,235,0.08)", color: "#2563eb" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-shop-muted">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-shop-ink">
            {me?.firstName ? `Hey, ${me.firstName}` : "Admin overview"}
          </h1>
          <p className="mt-1 text-sm text-shop-muted">Manage orders, review catalog entries, and handle customer issues.</p>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
          style={{ background: "var(--shop-accent-soft)", color: "var(--shop-primary)" }}
        >
          {me?.role === "ADMIN_SUPER" ? "Super admin" : "Staff"}
        </span>
      </div>

      {(ordErr || prodErr) && (
        <div className="space-y-4">
          {ordErr ? <ErrorState error={ordError} title="Could not load orders" /> : null}
          {prodErr ? <ErrorState error={prodError} title="Could not load products" /> : null}
        </div>
      )}

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((m) => (
          <article key={m.label} className="rounded-2xl border border-shop-border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-shop-muted">{m.label}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: m.bg }}>
                <m.Icon className="h-[18px] w-[18px]" style={{ color: m.color }} aria-hidden />
              </span>
            </div>
            <p className="mt-4 text-3xl font-bold tabular-nums text-shop-ink">{m.value}</p>
            <p className="mt-1 text-xs text-shop-muted">{m.sub}</p>
          </article>
        ))}
      </div>

      {/* Quick actions */}
      {quickLinks.length > 0 && (
        <div>
          <h2 className="mb-3 text-base font-semibold text-shop-ink">Quick actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {quickLinks.map(({ href, label, icon: Icon, description }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-2xl border border-shop-border bg-white p-4 shadow-sm transition hover:border-shop-primary/30 hover:shadow-md"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "var(--shop-accent-soft)" }}
                >
                  <Icon className="h-[18px] w-[18px]" style={{ color: "var(--shop-primary)" }} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-shop-ink">{label}</p>
                  <p className="truncate text-xs text-shop-muted">{description}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-shop-muted/50 transition group-hover:text-shop-primary" aria-hidden />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className="rounded-2xl border border-shop-border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-shop-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-shop-ink">Recent orders</h2>
            <p className="mt-0.5 text-xs text-shop-muted">The 5 most recent orders placed</p>
          </div>
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-sm font-medium text-shop-primary transition hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>

        <div className="p-4">
          {recent.length === 0 ? (
            <div className="rounded-xl border border-dashed border-shop-border bg-(--background)/60 py-10 text-center">
              <Package className="mx-auto h-8 w-8 text-shop-muted/50" aria-hidden />
              <p className="mt-3 text-sm font-medium text-shop-muted">No orders yet</p>
              <p className="mt-1 text-xs text-shop-muted">Orders placed by customers will show up here.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {recent.map((order) => {
                const { amount, currency } = orderTotal(order);
                const image = order.items[0]?.images?.[0];
                return (
                  <li
                    key={order.id}
                    className="flex items-center gap-4 rounded-2xl border border-shop-border bg-white p-4"
                  >
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-(--background)">
                      {image ? (
                        <Image src={image} alt="" fill unoptimized className="object-contain p-1" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-shop-muted/50">
                          <Package className="h-5 w-5" aria-hidden />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-xs text-shop-muted">{order.id}</p>
                      {order.userEmail && <p className="truncate text-sm text-shop-ink">{order.userEmail}</p>}
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={order.status} />
                      <span className="text-sm font-semibold tabular-nums text-shop-ink">
                        {formatApiMoney(amount, currency)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

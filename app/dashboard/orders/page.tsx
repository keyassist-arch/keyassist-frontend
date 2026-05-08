"use client";

import { useMemo, useState } from "react";
import { Package } from "lucide-react";
import Link from "next/link";
import { OrderCard } from "@/components/dashboard/order-card";
import { ErrorState, LoadingState } from "@/components/feedback/query-state";
import { isActiveOrderStatus, sortOrdersNewestFirst } from "@/lib/dashboard-orders";
import { useGetOrdersQuery } from "@/store/routes/unified-commerce-api";
import { useAppSelector } from "@/store/hooks";
import { useOrderRealtime } from "@/hooks/use-order-realtime";
import type { OrderResponse } from "@/types/api";

type FilterKey = "all" | "active" | "delivered" | "cancelled";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "active",    label: "In progress" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

function filterOrders(orders: OrderResponse[], filter: FilterKey): OrderResponse[] {
  if (filter === "all") return orders;
  if (filter === "active") return orders.filter((o) => isActiveOrderStatus(o.status));
  if (filter === "delivered") return orders.filter((o) => o.status === "DELIVERED");
  if (filter === "cancelled") return orders.filter((o) => o.status === "CANCELLED" || o.status === "REFUNDED" || o.status === "DISPUTED");
  return orders;
}

export default function DashboardOrdersPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: orders, isLoading, isError, error, refetch } = useGetOrdersQuery(undefined, { skip: !token });
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  useOrderRealtime(token, () => {
    void refetch();
  });

  const sorted = useMemo(() => (orders ? sortOrdersNewestFirst(orders) : []), [orders]);
  const filtered = useMemo(() => filterOrders(sorted, activeFilter), [sorted, activeFilter]);

  if (isLoading) return <LoadingState label="Loading orders…" />;
  if (isError) return <ErrorState error={error} title="Could not load orders" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            {sorted.length > 0
              ? `${sorted.length} order${sorted.length !== 1 ? "s" : ""} placed`
              : "Track and manage your purchases"}
          </p>
        </div>
      </div>

      {/* Filter pills */}
      {sorted.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count = filterOrders(sorted, f.key).length;
            const active = activeFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-[#5C4AE6] text-white shadow-sm"
                    : "border border-black/10 bg-white text-gray-600 hover:border-[#5C4AE6]/30 hover:text-[#5C4AE6]"
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                    active ? "bg-white/20 text-white" : "bg-black/[0.06] text-gray-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Order list */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-gray-50/60 py-14 text-center">
          <Package className="mx-auto h-9 w-9 text-gray-300" aria-hidden />
          <p className="mt-3 text-sm font-medium text-gray-500">
            {activeFilter === "all" ? "No orders yet" : `No ${FILTERS.find(f => f.key === activeFilter)?.label.toLowerCase()} orders`}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {activeFilter === "all"
              ? "Orders you place will appear here."
              : "Try a different filter above."}
          </p>
          {activeFilter === "all" && (
            <Link
              href="/shop"
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#5C4AE6] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#4c3bd6]"
            >
              Browse the shop
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} href={`/dashboard/orders/${order.id}`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

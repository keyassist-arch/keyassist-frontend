"use client";

import { OrderCard } from "@/components/dashboard/order-card";
import { ErrorState, LoadingState } from "@/components/feedback/query-state";
import { sortOrdersNewestFirst } from "@/lib/dashboard-orders";
import { useGetOrdersQuery } from "@/store/routes/unified-commerce-api";
import { useAppSelector } from "@/store/hooks";
import { useMemo } from "react";
import { useOrderRealtime } from "@/hooks/use-order-realtime";

export default function DashboardOrdersPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: orders, isLoading, isError, error, refetch } = useGetOrdersQuery(undefined, { skip: !token });

  useOrderRealtime(token, () => {
    void refetch();
  });

  const sorted = useMemo(() => (orders ? sortOrdersNewestFirst(orders) : []), [orders]);

  if (isLoading) return <LoadingState label="Loading orders…" />;

  if (isError) return <ErrorState error={error} title="Could not load orders" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-shop-ink">Orders</h1>
        <p className="mt-1 text-sm text-black/70">Track and open any order you&apos;ve placed.</p>
      </div>

      {sorted.length === 0 ? (
        <section className="card border-shop-border/80">
          <p className="text-sm text-black/70">You don&apos;t have any orders yet.</p>
        </section>
      ) : (
        <ul className="space-y-3">
          {sorted.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} href={`/dashboard/orders/${order.id}`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

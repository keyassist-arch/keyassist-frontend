"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { TrackingSection } from "@/components/dashboard/tracking-section";
import { ErrorState, LoadingState } from "@/components/feedback/query-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatApiMoney } from "@/lib/format-price";
import { orderLineTotal, orderTotal } from "@/lib/dashboard-orders";
import { orderCanInitializePayment } from "@/lib/order-checkout";
import { isUuid } from "@/lib/uuid";
import { useGetOrderQuery } from "@/store/routes/unified-commerce-api";
import { useAppSelector } from "@/store/hooks";
import { useOrderRealtime } from "@/hooks/use-order-realtime";

export default function DashboardOrderDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const token = useAppSelector((s) => s.auth.accessToken);
  const valid = Boolean(id && isUuid(id));

  const { data: order, isLoading, isError, error, refetch } = useGetOrderQuery(id, {
    skip: !token || !valid,
  });

  useOrderRealtime(token, (event) => {
    if (event.orderId === id) {
      void refetch();
    }
  });

  if (!valid) {
    return (
      <div className="space-y-4">
        <ErrorState error="That order link is not valid." title="Invalid order" />
        <Link href="/dashboard/orders" className="btn-secondary inline-block">
          Back to orders
        </Link>
      </div>
    );
  }

  if (isLoading && !order) return <LoadingState label="Loading order…" />;

  if (isError || !order) {
    return (
      <div className="space-y-4">
        <ErrorState error={error} title="Could not load order" />
        <Link href="/dashboard/orders" className="btn-secondary inline-block">
          Back to orders
        </Link>
      </div>
    );
  }

  const { amount, currency } = orderTotal(order);
  const tracking = order.tracking;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-black/45">Order</p>
          <h1 className="mt-1 font-mono text-lg font-semibold text-shop-ink sm:text-xl">{order.id}</h1>
          <p className="mt-2 text-sm text-black/70">
            Total <span className="font-semibold text-shop-ink">{formatApiMoney(amount, currency)}</span>
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {orderCanInitializePayment(order) ? (
        <section className="card border-amber-200/80 bg-amber-50/80">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            <div>
              <h2 className="text-sm font-semibold text-shop-ink">Complete payment</h2>
              <p className="mt-1 text-sm text-black/70">
                This order is unpaid. Your cart was already applied — finish payment to complete checkout.
              </p>
              <Link href={`/checkout?resume=${order.id}`} className="btn-primary mt-3 inline-block">
                Pay now
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {order.payment?.provider ? (
        <section className="card border-shop-border/80">
          <h2 className="text-sm font-semibold text-shop-ink">Payment</h2>
          <p className="mt-2 text-sm text-black/70">
            Provider: <span className="font-medium text-shop-ink">{order.payment.provider}</span>
          </p>
          {order.payment.methodDetails && typeof order.payment.methodDetails.checkoutId === "string" ? (
            <p className="mt-1 break-all text-xs text-black/55">
              <span className="font-medium text-black/70">Payment reference:</span> {order.payment.methodDetails.checkoutId}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="card border-shop-border/80">
        <h2 className="text-base font-semibold text-shop-ink">Items</h2>
        <ul className="mt-4 divide-y divide-black/10">
          {order.items.map((item, idx) => (
            <li key={`${item.title}-${idx}`} className="flex gap-4 py-4 first:pt-0">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-shop-surface">
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-black/35">No image</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-shop-ink">{item.title}</p>
                <p className="mt-1 text-sm text-black/70">
                  {formatApiMoney(item.price, item.currency)} × {item.quantity}
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium tabular-nums text-shop-ink">
                {formatApiMoney(orderLineTotal(item), item.currency)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="card border-shop-border/80">
        <h2 className="text-base font-semibold text-shop-ink">Tracking &amp; delivery</h2>
        <p className="mt-1 text-sm text-black/70">Updates from carriers and our fulfillment team.</p>
        <div className="mt-6">
          <TrackingSection tracking={tracking} />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/orders" className="btn-secondary inline-block">
          All orders
        </Link>
        <Link href={`/checkout/success?order_id=${order.id}`} className="btn-secondary inline-block">
          View payment receipt
        </Link>
      </div>
    </div>
  );
}

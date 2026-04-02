import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatApiMoney } from "@/lib/format-price";
import type { OrderResponse } from "@/types/api";
import { orderTotal } from "@/lib/dashboard-orders";

type Props = {
  order: OrderResponse;
  href: string;
  compact?: boolean;
};

export function OrderCard({ order, href, compact }: Props) {
  const { amount, currency } = orderTotal(order);
  const preview = order.items[0];
  const title =
    order.items.length === 1
      ? preview?.title ?? "Order"
      : `${preview?.title ?? "Items"} + ${order.items.length - 1} more`;

  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-black/10 bg-white p-4 transition hover:border-shop-accent/40 hover:shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-black/45">Order</p>
          <p className="mt-0.5 font-mono text-sm font-medium text-shop-ink group-hover:text-shop-accent">
            {order.id.slice(0, 8)}…{order.id.slice(-4)}
          </p>
          {!compact ? <p className="mt-1 line-clamp-2 text-sm text-black/70">{title}</p> : null}
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-medium text-shop-ink">{formatApiMoney(amount, currency)}</span>
        <span className="text-black/50">
          {order.items.length} line{order.items.length === 1 ? "" : "s"}
        </span>
        {order.payment?.provider ? (
          <span className="text-xs text-black/45">via {order.payment.provider}</span>
        ) : null}
      </div>
    </Link>
  );
}

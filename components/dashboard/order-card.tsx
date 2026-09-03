import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
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
  const firstItem = order.items[0];
  const image = firstItem?.images?.[0];
  const title =
    order.items.length === 1
      ? firstItem?.title ?? "Order"
      : `${firstItem?.title ?? "Items"} +${order.items.length - 1} more`;

  const shortId = `${order.id.slice(0, 8)}…${order.id.slice(-4)}`;

  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-shop-border bg-white p-4 transition hover:border-shop-primary/30 hover:shadow-md"
    >
      {/* Image thumbnail */}
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-(--background)">
        {image ? (
          <Image
            src={image}
            alt=""
            fill
            className="object-contain p-1"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-shop-muted/50">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {!compact && (
          <p className="truncate text-sm font-medium text-shop-ink">{title}</p>
        )}
        <p className={`font-mono text-xs text-shop-muted ${compact ? "" : "mt-0.5"}`}>{shortId}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <StatusBadge status={order.status} />
          <span className="text-xs text-shop-muted">
            {order.items.length} item{order.items.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Amount + arrow */}
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm font-semibold tabular-nums text-shop-ink">
          {formatApiMoney(amount, currency)}
        </span>
        <ArrowRight className="h-4 w-4 text-shop-muted/50 transition group-hover:text-shop-primary" aria-hidden />
      </div>
    </Link>
  );
}

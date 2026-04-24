import type { OrderResponse } from "@/types/api";
import { coerceNumber } from "@/lib/coerce-number";

export function orderLineTotal(item: OrderResponse["items"][number]): number {
  return item.price * item.quantity;
}

export function orderTotal(order: OrderResponse): { amount: number; currency: string } {
  const currency = order.currency ?? order.items[0]?.currency ?? "USD";
  const fromApi = coerceNumber(order.total, NaN);
  const amount = Number.isFinite(fromApi) ? fromApi : order.items.reduce((s, i) => s + orderLineTotal(i), 0);
  return { amount, currency };
}

const ACTIVE: OrderResponse["status"][] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "ORDERED_FROM_SUPPLIER",
  "SHIPPED",
];

export function isActiveOrderStatus(status: OrderResponse["status"]): boolean {
  return ACTIVE.includes(status);
}

export function sortOrdersNewestFirst(orders: OrderResponse[]): OrderResponse[] {
  return [...orders].reverse();
}

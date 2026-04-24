import type { OrderResponse } from "@/types/api";

/** Prefer `order.checkout` when present; fall back to status for older API responses. */
export function orderCanInitializePayment(order: OrderResponse): boolean {
  if (order.checkout) {
    return order.checkout.canInitializePayment;
  }
  return order.status === "PENDING";
}

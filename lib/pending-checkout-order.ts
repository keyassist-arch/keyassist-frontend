/** sessionStorage key — until `GET /orders/:id` is `PAID` (see integration guide). */
const KEY = "pendingCheckoutOrderId";

export function setPendingCheckoutOrderId(orderId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, orderId);
}

export function getPendingCheckoutOrderId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(KEY);
}

export function clearPendingCheckoutOrderId(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}

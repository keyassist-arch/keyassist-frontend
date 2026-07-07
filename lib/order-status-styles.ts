import type { OrderStatus } from "@/types/api";

export interface StatusStyle {
  bg: string;
  border: string;
  text: string;
  dot: string;
}

/** Canonical, high-contrast colors for every order status — shared by admin and customer surfaces. */
export const ORDER_STATUS_STYLES: Record<OrderStatus, StatusStyle> = {
  PENDING:               { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-800",   dot: "bg-amber-500" },
  PAID:                  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", dot: "bg-emerald-500" },
  PROCESSING:            { bg: "bg-teal-50",    border: "border-teal-200",    text: "text-teal-800",    dot: "bg-teal-500" },
  ORDERED_FROM_SUPPLIER: { bg: "bg-cyan-50",    border: "border-cyan-200",    text: "text-cyan-800",    dot: "bg-cyan-500" },
  SHIPPED:               { bg: "bg-lime-50",    border: "border-lime-200",    text: "text-lime-800",    dot: "bg-lime-500" },
  DELIVERED:             { bg: "bg-green-50",   border: "border-green-200",   text: "text-green-800",   dot: "bg-green-500" },
  CANCELLED:             { bg: "bg-gray-100",   border: "border-gray-300",    text: "text-gray-700",    dot: "bg-gray-500" },
  REFUNDED:              { bg: "bg-orange-50",  border: "border-orange-200",  text: "text-orange-800",  dot: "bg-orange-500" },
  DISPUTED:              { bg: "bg-rose-50",    border: "border-rose-200",    text: "text-rose-800",    dot: "bg-rose-500" },
};

/** Returns the canonical style for a known `OrderStatus`, or `undefined` for anything else (refund/issue statuses, etc). */
export function orderStatusStyle(status: string): StatusStyle | undefined {
  return ORDER_STATUS_STYLES[status.toUpperCase() as OrderStatus];
}

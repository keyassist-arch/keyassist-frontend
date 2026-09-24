import type { OrderDisplaySummary } from "@/types/api";

export type OrderSummaryRow = {
  label: string;
  amount: number;
  /** Discounts render as a negative, highlighted line. */
  discount?: boolean;
};

/**
 * Line items for an order's `displaySummary`, in the same order and wording as the
 * checkout quote: Product (COGS) + Shipping + Service + Insurance − Discount = Total.
 * Insurance and discount are only listed when non-zero.
 */
export function orderSummaryRows(summary: OrderDisplaySummary): OrderSummaryRow[] {
  const rows: OrderSummaryRow[] = [
    { label: "Product (COGS)", amount: Number(summary.product) },
    { label: "Shipping", amount: Number(summary.importAndDelivery) },
    { label: "Service", amount: Number(summary.serviceFee) },
  ];
  const insurance = Number(summary.insurance ?? 0);
  if (insurance > 0) rows.push({ label: "Insurance", amount: insurance });
  const discount = Number(summary.discount);
  if (discount > 0) rows.push({ label: "Discount", amount: discount, discount: true });
  return rows;
}

"use client";

import { createPortal } from "react-dom";
import { formatApiMoney } from "@/lib/format-price";
import { orderLineTotal, orderTotal } from "@/lib/dashboard-orders";
import { orderSummaryRows } from "@/lib/order-summary";
import type { OrderResponse } from "@/types/api";

const PROVIDER_LABELS: Record<string, string> = {
  stripe: "Card (Stripe)",
  paystack: "Paystack",
  paypal: "PayPal",
  myaza: "Myaza",
};

function paymentLabel(order: OrderResponse): string {
  const details = order.payment?.methodDetails as
    | { label?: unknown; brand?: unknown; last4?: unknown }
    | undefined;
  if (typeof details?.label === "string" && details.label) return details.label;
  if (typeof details?.last4 === "string" && details.last4) {
    const brand = typeof details.brand === "string" ? details.brand.toUpperCase() : "Card";
    return `${brand} •••• ${details.last4}`;
  }
  const provider = order.payment?.provider;
  return provider ? (PROVIDER_LABELS[provider] ?? provider) : "—";
}

function formatDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Print-only receipt. Rendered into <body> and hidden on screen; the `@media print`
 * rules in globals.css hide the rest of the page so `window.print()` outputs just this.
 */
export function OrderReceipt({ order, fallbackEmail }: { order: OrderResponse; fallbackEmail?: string | null }) {
  // Only rendered once the order has loaded client-side, but guard SSR regardless.
  if (typeof document === "undefined") return null;

  const paid = order.status === "PAID";
  const summary = order.displaySummary;
  const { amount, currency } = summary
    ? { amount: Number(summary.total), currency: summary.currency }
    : orderTotal(order);
  const addr = order.shippingAddress;
  const email = order.userEmail || fallbackEmail;

  return createPortal(
    <div className="print-receipt" aria-hidden>
      <header className="pr-header">
        <div>
          <p className="pr-brand">Key Assist</p>
          <p className="pr-muted">keyassistco.com</p>
        </div>
        <div className="pr-right">
          <p className="pr-title">{paid ? "Receipt" : "Order summary"}</p>
          <p className="pr-muted">{paid ? "Paid" : "Awaiting payment"}</p>
        </div>
      </header>

      <section className="pr-meta">
        <div>
          <p className="pr-label">Order number</p>
          <p className="pr-mono">{order.orderNumber ? `#${order.orderNumber}` : order.id}</p>
        </div>
        <div>
          <p className="pr-label">Order date</p>
          <p>{formatDate(order.createdAt)}</p>
        </div>
        <div>
          <p className="pr-label">Payment method</p>
          <p>{paymentLabel(order)}</p>
        </div>
      </section>

      <section className="pr-meta">
        <div>
          <p className="pr-label">Billed to</p>
          {addr?.fullName ? <p>{addr.fullName}</p> : null}
          {email ? <p>{email}</p> : null}
          {addr?.phone ? <p>{addr.phone}</p> : null}
        </div>
        <div>
          <p className="pr-label">Ship to</p>
          {addr ? (
            <>
              <p>{[addr.line1, addr.line2].filter(Boolean).join(", ")}</p>
              <p>{[addr.city, addr.state, addr.postalCode].filter(Boolean).join(", ")}</p>
              <p>{addr.country}</p>
            </>
          ) : (
            <p>—</p>
          )}
        </div>
      </section>

      <table className="pr-items">
        <thead>
          <tr>
            <th>Item</th>
            <th className="pr-num">Qty</th>
            <th className="pr-num">Unit price</th>
            <th className="pr-num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={`${item.title}-${idx}`}>
              <td>{item.title}</td>
              <td className="pr-num">{item.quantity}</td>
              <td className="pr-num">{formatApiMoney(item.price, item.currency)}</td>
              <td className="pr-num">{formatApiMoney(orderLineTotal(item), item.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="pr-totals">
        {summary
          ? orderSummaryRows(summary).map(({ label, amount: value, discount }) => (
              <div key={label} className="pr-row">
                <span>{label}</span>
                <span>
                  {discount ? "−" : ""}
                  {formatApiMoney(value, summary.currency)}
                </span>
              </div>
            ))
          : null}
        <div className="pr-row pr-total">
          <span>{paid ? "Total paid" : "Total due"}</span>
          <span>{formatApiMoney(amount, currency)}</span>
        </div>
      </section>

      <footer className="pr-footer">
        <p>Product (COGS) includes the item price, US sales tax and any retailer charges.</p>
        <p>Thank you for shopping with Key Assist. Questions? Visit keyassistco.com/contact.</p>
      </footer>
    </div>,
    document.body,
  );
}

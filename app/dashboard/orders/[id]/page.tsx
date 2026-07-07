"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, CreditCard, MapPin, Package } from "lucide-react";
import { useParams } from "next/navigation";
import { TrackingSection } from "@/components/dashboard/tracking-section";
import { ErrorState, LoadingState } from "@/components/feedback/query-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatApiMoney } from "@/lib/format-price";
import { orderLineTotal, orderTotal } from "@/lib/dashboard-orders";
import { orderCanInitializePayment } from "@/lib/order-checkout";
import { isUuid } from "@/lib/uuid";
import { useGetOrderQuery, useCancelOrderMutation } from "@/store/routes/unified-commerce-api";
import { useAppSelector } from "@/store/hooks";
import { useOrderRealtime } from "@/hooks/use-order-realtime";
import { getErrorMessage } from "@/lib/rtk-error";
import type { OrderStatus, OrderDisplaySummary } from "@/types/api";

function OrderTotals({
  summary,
  fallbackAmount,
  fallbackCurrency,
}: {
  summary?: OrderDisplaySummary;
  fallbackAmount: number;
  fallbackCurrency: string;
}) {
  if (summary) {
    const cur = summary.currency;
    return (
      <>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Product</span>
          <span className="font-medium text-gray-700">{formatApiMoney(Number(summary.product), cur)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Import &amp; delivery</span>
          <span className="font-medium text-gray-700">{formatApiMoney(Number(summary.importAndDelivery), cur)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Service fee</span>
          <span className="font-medium text-gray-700">{formatApiMoney(Number(summary.serviceFee), cur)}</span>
        </div>
        {Number(summary.discount) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Discount</span>
            <span className="font-medium text-emerald-600">−{formatApiMoney(Number(summary.discount), cur)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-black/[0.06] pt-3 text-sm font-semibold">
          <span className="text-gray-900">Total</span>
          <span className="text-gray-900">{formatApiMoney(Number(summary.total), cur)}</span>
        </div>
      </>
    );
  }
  return (
    <div className="flex justify-between border-t border-black/[0.06] pt-3 text-sm font-semibold">
      <span className="text-gray-900">Total</span>
      <span className="text-gray-900">{formatApiMoney(fallbackAmount, fallbackCurrency)}</span>
    </div>
  );
}

// Status journey — ordered steps for normal fulfilment
const JOURNEY: { status: OrderStatus; label: string }[] = [
  { status: "PENDING",               label: "Order placed" },
  { status: "PAID",                  label: "Payment confirmed" },
  { status: "PROCESSING",            label: "Processing" },
  { status: "ORDERED_FROM_SUPPLIER", label: "Supplier ordered" },
  { status: "SHIPPED",               label: "Shipped" },
  { status: "DELIVERED",             label: "Delivered" },
];

const TERMINAL_STATUSES: OrderStatus[] = ["CANCELLED", "REFUNDED", "DISPUTED"];

function StatusJourney({ status }: { status: OrderStatus | string }) {
  const isTerminal = TERMINAL_STATUSES.includes(status as OrderStatus);
  const currentIndex = JOURNEY.findIndex((s) => s.status === status);

  if (isTerminal) {
    const label = status === "REFUNDED" ? "Refunded" : status === "DISPUTED" ? "Disputed" : "Cancelled";
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertCircle className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-red-700">Order {label}</p>
          <p className="text-xs text-red-500">This order is no longer active.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-center gap-0">
        {JOURNEY.map((step, i) => {
          const done = currentIndex >= i;
          const current = currentIndex === i;
          return (
            <div key={step.status} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                    done
                      ? current
                        ? "bg-[#059669] text-white ring-4 ring-[#059669]/20"
                        : "bg-[#059669] text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {done && !current ? (
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                  ) : (
                    <span>{i + 1}</span>
                  )}
                </span>
                <span
                  className={`max-w-[72px] text-center text-[10px] leading-tight ${
                    done ? "font-semibold text-gray-700" : "text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < JOURNEY.length - 1 && (
                <div
                  className={`mx-1 mb-5 h-0.5 w-10 sm:w-14 ${done && currentIndex > i ? "bg-[#059669]" : "bg-gray-100"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardOrderDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const token = useAppSelector((s) => s.auth.accessToken);
  const valid = Boolean(id && isUuid(id));

  const { data: order, isLoading, isError, error, refetch } = useGetOrderQuery(id, {
    skip: !token || !valid,
  });
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  useOrderRealtime(token, (event) => {
    if (event.orderId === id) void refetch();
  });

  const onCancelOrder = async () => {
    setCancelError(null);
    try {
      await cancelOrder(id).unwrap();
      setShowCancelModal(false);
    } catch (err) {
      setCancelError(getErrorMessage(err));
    }
  };

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

  const { amount, currency } = order.displaySummary
    ? { amount: Number(order.displaySummary.total), currency: order.displaySummary.currency }
    : orderTotal(order);

  return (
    <>
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/dashboard/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Orders
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Order ID</p>
            <p className="mt-1 break-all font-mono text-lg font-semibold text-gray-900">{order.id}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-black/[0.06] pt-4 text-sm">
          <div>
            <span className="text-gray-400">Total</span>
            <span className="ml-2 font-semibold text-gray-900">{formatApiMoney(amount, currency)}</span>
          </div>
          <div>
            <span className="text-gray-400">Items</span>
            <span className="ml-2 font-semibold text-gray-900">
              {order.items.length} line{order.items.length !== 1 ? "s" : ""}
            </span>
          </div>
          {order.payment?.provider && (
            <div>
              <span className="text-gray-400">Payment</span>
              <span className="ml-2 font-semibold text-gray-900 capitalize">{order.payment.provider}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status journey */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold text-gray-900">Order status</h2>
        <StatusJourney status={order.status} />
      </div>

      {/* Unpaid action */}
      {orderCanInitializePayment(order) && (
        <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <AlertCircle className="h-4.5 w-4.5" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-amber-900">Complete payment</h2>
            <p className="mt-1 text-sm text-amber-700">
              This order is unpaid. Your cart was already applied — finish payment to confirm your order.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link href={`/checkout?resume=${order.id}`} className="btn-primary inline-block">
                Pay now
              </Link>
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center rounded-full border border-amber-300 px-5 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100"
              >
                Cancel order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="rounded-2xl border border-black/[0.06] bg-white shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-black/[0.06] px-6 py-4">
          <Package className="h-4 w-4 text-gray-400" aria-hidden />
          <h2 className="text-sm font-semibold text-gray-900">
            Items ({order.items.length})
          </h2>
        </div>
        <ul className="divide-y divide-black/[0.06]">
          {order.items.map((item, idx) => {
            const lineTotal = orderLineTotal(item);
            return (
              <li key={`${item.title}-${idx}`} className="flex gap-4 p-5">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-50">
                  {item.images?.[0] ? (
                    <Image
                      src={item.images[0]}
                      alt=""
                      fill
                      className="object-contain p-1"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                      <Package className="h-6 w-6" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 line-clamp-2">{item.title}</p>
                  <p className="mt-1 text-sm text-gray-400">
                    {formatApiMoney(item.price, item.currency)} × {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                  {formatApiMoney(lineTotal, item.currency)}
                </p>
              </li>
            );
          })}
        </ul>

        {/* Totals footer */}
        <div className="space-y-2 border-t border-black/[0.06] px-6 py-4">
          <OrderTotals summary={order.displaySummary} fallbackAmount={amount} fallbackCurrency={currency} />
        </div>

        {/* Pricing breakdown accordion */}
        {order.pricingBreakdown && order.pricingBreakdown.length > 0 && (
          <details className="border-t border-black/[0.06] px-6 py-3 text-xs text-gray-500">
            <summary className="cursor-pointer select-none font-medium text-gray-600 hover:text-gray-900">
              Cost breakdown
            </summary>
            <ul className="mt-3 space-y-0.5 font-mono">
              {order.pricingBreakdown.map((line, i) => (
                <li key={i} className="whitespace-pre-wrap">{line}</li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {/* Payment */}
      {order.payment?.provider && (
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2.5">
            <CreditCard className="h-4 w-4 text-gray-400" aria-hidden />
            <h2 className="text-sm font-semibold text-gray-900">Payment</h2>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            <div>
              <p className="text-xs text-gray-400">Provider</p>
              <p className="mt-0.5 font-medium capitalize text-gray-900">{order.payment.provider}</p>
            </div>
            {order.payment.methodDetails?.checkoutId && (
              <div>
                <p className="text-xs text-gray-400">Reference</p>
                <p className="mt-0.5 break-all font-mono text-xs text-gray-600">
                  {String(order.payment.methodDetails.checkoutId)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shipping address */}
      {order.shippingAddress && (
        <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2.5">
            <MapPin className="h-4 w-4 text-gray-400" aria-hidden />
            <h2 className="text-sm font-semibold text-gray-900">Shipping address</h2>
          </div>
          <address className="mt-4 text-sm not-italic leading-relaxed text-gray-600">
            {[
              order.shippingAddress.line1,
              order.shippingAddress.line2,
              order.shippingAddress.city,
              order.shippingAddress.state,
              order.shippingAddress.postalCode,
              order.shippingAddress.country,
            ]
              .filter(Boolean)
              .join(", ")}
          </address>
        </div>
      )}

      {/* Tracking */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <svg className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
          </svg>
          <h2 className="text-sm font-semibold text-gray-900">Tracking &amp; delivery</h2>
        </div>
        <p className="mt-1 text-xs text-gray-400">Carrier updates and fulfilment events.</p>
        <div className="mt-5">
          <TrackingSection tracking={order.tracking} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pb-4">
        <Link href="/dashboard/orders" className="btn-secondary inline-block">
          All orders
        </Link>
        <Link href={`/checkout/success?order_id=${order.id}`} className="btn-secondary inline-block">
          View receipt
        </Link>
      </div>
    </div>

    {showCancelModal && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-gray-900">Cancel order</h3>
          <p className="mt-2 text-sm text-gray-500">
            Are you sure you want to cancel this order? This cannot be undone.
          </p>
          {cancelError && (
            <div className="mt-3">
              <ErrorState error={cancelError} title="Could not cancel order" />
            </div>
          )}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              disabled={cancelling}
              className="flex-1 rounded-full border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Keep order
            </button>
            <button
              type="button"
              onClick={onCancelOrder}
              disabled={cancelling}
              className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {cancelling ? "Cancelling…" : "Cancel order"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

"use client";

import { useState } from "react";
import Image from "next/image";
import { Copy, Check, Package, Truck } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import {
  useGetAdminOrdersQuery,
  usePatchAdminOrderMutation,
} from "@/store/routes/unified-commerce-api";
import type { OrderResponse, OrderStatus, PatchAdminOrderRequest } from "@/types/api";
import { ErrorState, SuccessState } from "@/components/feedback/query-state";
import { AdminListSkeleton } from "@/components/dashboard/admin-list-skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { OrderTrackingModal, type TrackingFormValues } from "@/components/dashboard/order-tracking-modal";
import { orderStatusStyle } from "@/lib/order-status-styles";
import { formatApiMoney } from "@/lib/format-price";
import { orderTotal } from "@/lib/dashboard-orders";
import { getErrorMessage } from "@/lib/rtk-error";

const ADMIN_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "ORDERED_FROM_SUPPLIER",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
  "DISPUTED",
];

function shortId(id: string) {
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}

export default function AdminOrdersPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: adminOrders, isLoading, isError, error } = useGetAdminOrdersQuery(undefined, { skip: !token });
  const [patchOrder, { isLoading: patching }] = usePatchAdminOrderMutation();
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<OrderResponse | null>(null);

  const onPatch = async (id: string, body: PatchAdminOrderRequest) => {
    setNotice(null);
    try {
      await patchOrder({ id, body }).unwrap();
      setNotice({ ok: true, text: "Order updated." });
    } catch (e) {
      setNotice({ ok: false, text: getErrorMessage(e) });
    }
  };

  const onSaveTracking = async (values: TrackingFormValues) => {
    if (!trackingOrder) return;
    await onPatch(trackingOrder.id, values);
    setTrackingOrder(null);
  };

  const copyId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) return <AdminListSkeleton />;
  if (isError) return <ErrorState error={error} title="Could not load orders" />;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-shop-border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-shop-ink">Orders</h1>
        <p className="mt-1 text-sm text-shop-muted">Manage orders, update status, and add tracking information.</p>
      </section>

      {notice?.ok && <SuccessState message={notice.text} />}
      {notice && !notice.ok && <ErrorState error={notice.text} title="Update failed" />}

      <div className="space-y-4">
        {(adminOrders ?? []).map((order) => {
          const { amount, currency } = orderTotal(order);
          const selectStyle = orderStatusStyle(order.status);
          const latestTracking = order.tracking?.[order.tracking.length - 1];

          return (
            <article
              key={order.id}
              className="rounded-2xl border border-shop-border bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={order.status} />
                    <span className="text-xs text-shop-muted">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-shop-muted">{shortId(order.id)}</span>
                    <button
                      type="button"
                      onClick={() => copyId(order.id)}
                      className="text-shop-muted transition hover:text-shop-ink"
                      aria-label="Copy order ID"
                    >
                      {copiedId === order.id ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                  {order.userEmail && (
                    <p className="truncate text-sm font-medium text-shop-ink">{order.userEmail}</p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold tabular-nums text-shop-ink">{formatApiMoney(amount, currency)}</p>
                  {latestTracking && (
                    <p className="mt-1 flex items-center justify-end gap-1 text-xs text-shop-muted">
                      <Truck className="h-3 w-3 shrink-0" aria-hidden />
                      <span className="truncate">{latestTracking.carrier} · {latestTracking.trackingNumber}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Items */}
              {order.items.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-shop-border pt-4">
                  {order.items.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-xl border border-shop-border bg-(--background) px-2.5 py-1.5 text-xs">
                      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-white">
                        {item.images?.[0] ? (
                          <Image src={item.images[0]} alt="" fill unoptimized className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-shop-muted/50">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 max-w-[160px]">
                        <p className="truncate font-medium text-shop-ink">{item.title}</p>
                        <p className="text-shop-muted">{item.quantity} &times; {formatApiMoney(item.price, item.currency)}</p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 5 && (
                    <span className="flex items-center text-xs text-shop-muted">+{order.items.length - 5} more</span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-shop-border pt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-shop-muted">Status</span>
                  <select
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium outline-none transition focus:ring-2 focus:ring-shop-primary/10 ${selectStyle?.bg ?? "bg-(--background)"} ${selectStyle?.border ?? "border-shop-border"} ${selectStyle?.text ?? "text-shop-ink"}`}
                    value={order.status}
                    disabled={patching}
                    onChange={(e) => {
                      const v = e.target.value as OrderStatus;
                      void onPatch(order.id, { status: v });
                    }}
                  >
                    {ADMIN_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setTrackingOrder(order)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-shop-border bg-white px-4 py-1.5 text-xs font-medium text-shop-ink transition hover:bg-(--background)"
                >
                  <Truck className="h-3.5 w-3.5" aria-hidden />
                  {latestTracking ? "Update tracking" : "Add tracking"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <OrderTrackingModal
        order={trackingOrder}
        open={trackingOrder !== null}
        busy={patching}
        onClose={() => setTrackingOrder(null)}
        onSave={onSaveTracking}
      />
    </div>
  );
}

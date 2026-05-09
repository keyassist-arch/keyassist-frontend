"use client";

import { useState } from "react";
import { Copy, Check, Package } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import {
  useGetAdminOrdersQuery,
  usePatchAdminOrderMutation,
} from "@/store/routes/unified-commerce-api";
import type { OrderStatus, PatchAdminOrderRequest } from "@/types/api";
import { ErrorState, LoadingState, SuccessState } from "@/components/feedback/query-state";
import { getErrorMessage } from "@/lib/rtk-error";
import { orderTotal } from "@/lib/dashboard-orders";

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

const STATUS_STYLES: Record<string, { bg: string; border: string; label: string; dot: string }> = {
  PENDING:              { bg: "bg-amber-50",  border: "border-amber-200",  label: "text-amber-800",  dot: "bg-amber-500" },
  PAID:                 { bg: "bg-emerald-50",  border: "border-emerald-200",  label: "text-emerald-800",  dot: "bg-emerald-500" },
  PROCESSING:           { bg: "bg-blue-50",    border: "border-blue-200",    label: "text-blue-800",    dot: "bg-blue-500" },
  ORDERED_FROM_SUPPLIER:{ bg: "bg-indigo-50",  border: "border-indigo-200",  label: "text-indigo-800",  dot: "bg-indigo-500" },
  SHIPPED:              { bg: "bg-purple-50",  border: "border-purple-200",  label: "text-purple-800",  dot: "bg-purple-500" },
  DELIVERED:            { bg: "bg-green-50",   border: "border-green-200",   label: "text-green-800",   dot: "bg-green-500" },
  CANCELLED:            { bg: "bg-red-50",     border: "border-red-200",     label: "text-red-800",     dot: "bg-red-500" },
  REFUNDED:             { bg: "bg-orange-50",  border: "border-orange-200",  label: "text-orange-800",  dot: "bg-orange-500" },
  DISPUTED:             { bg: "bg-rose-50",    border: "border-rose-200",    label: "text-rose-800",    dot: "bg-rose-500" },
};

function statusStyle(status: string) {
  return STATUS_STYLES[status] ?? { bg: "bg-gray-50", border: "border-gray-200", label: "text-gray-800", dot: "bg-gray-500" };
}

function shortId(id: string) {
  return id.length > 12 ? `${id.slice(0, 6)}…${id.slice(-4)}` : id;
}

export default function AdminOrdersPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: adminOrders, isLoading, isError, error } = useGetAdminOrdersQuery(undefined, { skip: !token });
  const [patchOrder, { isLoading: patching }] = usePatchAdminOrderMutation();
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const onPatch = async (id: string, body: PatchAdminOrderRequest) => {
    setNotice(null);
    try {
      await patchOrder({ id, body }).unwrap();
      setNotice({ ok: true, text: "Order updated." });
    } catch (e) {
      setNotice({ ok: false, text: getErrorMessage(e) });
    }
  };

  const copyId = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) return <LoadingState label="Loading orders…" />;
  if (isError) return <ErrorState error={error} title="Could not load orders" />;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-gray-500">Manage orders, update status, and add tracking information.</p>
      </section>

      {notice?.ok && <SuccessState message={notice.text} />}
      {notice && !notice.ok && <ErrorState error={notice.text} title="Update failed" />}

      <div className="space-y-4">
        {(adminOrders ?? []).map((order) => {
          const { amount, currency } = orderTotal(order);
          const s = statusStyle(order.status);

          return (
            <article
              key={order.id}
              className={`rounded-2xl border-2 bg-white ${s.border} p-5 transition-shadow hover:shadow-sm`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${s.bg} ${s.label}`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
                      {order.status.replaceAll("_", " ")}
                    </span>
                    <span className="text-xs text-gray-400">
                      {order.items.length} {order.items.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500">{shortId(order.id)}</span>
                    <button
                      type="button"
                      onClick={() => copyId(order.id)}
                      className="text-gray-400 hover:text-gray-600 transition"
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
                    <p className="mt-1 text-sm font-medium text-gray-900">{order.userEmail}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{currency} {amount.toFixed(2)}</p>
                </div>
              </div>

              {order.items.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {order.items.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white/60 px-2.5 py-1.5 text-xs">
                      <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-gray-100">
                        {item.images?.[0] ? (
                          <img src={item.images[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-300">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 max-w-[160px]">
                        <p className="truncate font-medium text-gray-700">{item.title}</p>
                        <p className="text-gray-400">{item.quantity} &times; {item.currency} {Number(item.price).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                  {order.items.length > 5 && (
                    <span className="flex items-center text-xs text-gray-400">+{order.items.length - 5} more</span>
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Package className="h-3.5 w-3.5 text-gray-400" aria-hidden />
                <span className="text-xs text-gray-500">Status</span>
                <select
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium outline-none transition focus:ring-2 focus:ring-[#5C4AE6]/10 ${s.bg} ${s.border} ${s.label}`}
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

              <details className="mt-4 group">
                <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-700 transition">
                  tracking details
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <label className="block space-y-1 text-xs">
                    <span className="font-medium text-gray-500">Tracking number</span>
                    <input
                      className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#5C4AE6] focus:ring-2 focus:ring-[#5C4AE6]/10"
                      placeholder="e.g. 1Z999…"
                      defaultValue=""
                      id={`track-${order.id}`}
                    />
                  </label>
                  <label className="block space-y-1 text-xs">
                    <span className="font-medium text-gray-500">Carrier</span>
                    <input
                      className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#5C4AE6] focus:ring-2 focus:ring-[#5C4AE6]/10"
                      placeholder="e.g. DHL"
                      defaultValue=""
                      id={`carrier-${order.id}`}
                    />
                  </label>
                  <label className="block space-y-1 text-xs">
                    <span className="font-medium text-gray-500">Note for customer</span>
                    <input
                      className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#5C4AE6] focus:ring-2 focus:ring-[#5C4AE6]/10"
                      placeholder="e.g. Arrived at local hub"
                      defaultValue=""
                      id={`trackmsg-${order.id}`}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  className="mt-3 rounded-full border border-gray-200 bg-white px-5 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  disabled={patching}
                  onClick={() => {
                    const tr = (document.getElementById(`track-${order.id}`) as HTMLInputElement | null)?.value?.trim();
                    const car = (document.getElementById(`carrier-${order.id}`) as HTMLInputElement | null)?.value?.trim();
                    const msg = (document.getElementById(`trackmsg-${order.id}`) as HTMLInputElement | null)?.value?.trim();
                    if (tr && car) void onPatch(order.id, { trackingNumber: tr, carrier: car, trackingMessage: msg || undefined });
                  }}
                >
                  Save tracking
                </button>
              </details>
            </article>
          );
        })}
      </div>
    </div>
  );
}

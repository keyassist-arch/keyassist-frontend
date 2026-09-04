"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import {
  useGetAdminManualImportsQuery,
  useDismissAdminManualImportMutation,
} from "@/store/routes/unified-commerce-api";
import type { ManualImportFulfillmentStatus, ManualImportRequestSummary } from "@/types/api";
import { ErrorState, SuccessState } from "@/components/feedback/query-state";
import { AdminListSkeleton } from "@/components/dashboard/admin-list-skeleton";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { AdminManualImportOrderModal } from "@/components/dashboard/admin-manual-import-order-modal";
import { productDetailPath } from "@/lib/product-detail-path";
import { getErrorMessage } from "@/lib/rtk-error";

const TABS: { value: ManualImportFulfillmentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "ordered", label: "Ordered" },
  { value: "dismissed", label: "Dismissed" },
];

function requesterName(u: ManualImportRequestSummary["requestedByUser"]) {
  if (!u) return "Unknown customer";
  const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
  return name || u.email;
}

export default function AdminManualImportsPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const [status, setStatus] = useState<ManualImportFulfillmentStatus>("pending");
  const { data: requests, isLoading, isError, error } = useGetAdminManualImportsQuery(status, { skip: !token });
  const [dismissImport, { isLoading: dismissing }] = useDismissAdminManualImportMutation();

  const [orderTarget, setOrderTarget] = useState<ManualImportRequestSummary | null>(null);
  const [dismissTarget, setDismissTarget] = useState<ManualImportRequestSummary | null>(null);
  const [dismissReason, setDismissReason] = useState("");
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const onDismiss = async () => {
    if (!dismissTarget) return;
    setNotice(null);
    try {
      await dismissImport({ id: dismissTarget.id, body: { reason: dismissReason.trim() || undefined } }).unwrap();
      setNotice({ ok: true, text: "Request dismissed." });
      setDismissTarget(null);
      setDismissReason("");
    } catch (err) {
      setNotice({ ok: false, text: getErrorMessage(err) });
    }
  };

  if (isLoading) return <AdminListSkeleton />;
  if (isError) return <ErrorState error={error} title="Could not load manual import requests" />;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Manual requests</h1>
        <p className="mt-1 text-sm text-gray-500">
          Products customers submitted by hand after auto-import failed. Place an order on their behalf, or dismiss.
        </p>
      </section>

      {notice?.ok && <SuccessState message={notice.text} />}
      {notice && !notice.ok && <ErrorState error={notice.text} title="Action failed" />}

      <div className="flex gap-1.5 rounded-xl bg-gray-100 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setStatus(t.value)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              status === t.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(requests ?? []).length === 0 ? (
        <section className="rounded-2xl border border-black/[0.06] bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">No {status} requests.</p>
        </section>
      ) : (
        <div className="space-y-4">
          {(requests ?? []).map((row) => (
            <article
              key={row.id}
              className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-50">
                    {row.product?.images?.[0] ? (
                      <Image src={row.product.images[0]} alt="" fill unoptimized className="object-contain p-1" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <Package className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    {row.product ? (
                      <Link href={productDetailPath(row.product)} className="line-clamp-1 text-sm font-semibold text-gray-900 hover:text-[#059669]">
                        {row.product.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-gray-400">No product linked</p>
                    )}
                    <p className="truncate text-xs text-gray-400">{row.sourceUrl}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {requesterName(row.requestedByUser)}
                      {row.requestedByUser?.email && ` · ${row.requestedByUser.email}`}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(row.createdAt).toLocaleString()}</p>
                    {row.fulfillmentStatus === "dismissed" && row.dismissReason && (
                      <p className="mt-1 text-xs text-red-500">Reason: {row.dismissReason}</p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  {row.fulfillmentStatus === "pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => setOrderTarget(row)}
                        disabled={!row.product}
                        className="inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50"
                      >
                        Place order
                      </button>
                      <button
                        type="button"
                        onClick={() => setDismissTarget(row)}
                        className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-800 transition hover:bg-gray-50"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  {row.fulfillmentStatus === "ordered" && row.orderId && (
                    <Link
                      href="/admin/orders"
                      className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-800 transition hover:bg-gray-50"
                    >
                      View orders
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <AdminManualImportOrderModal
        request={orderTarget}
        onClose={() => setOrderTarget(null)}
        onPlaced={() => setNotice({ ok: true, text: "Order placed for the customer." })}
      />

      <ConfirmModal
        open={dismissTarget != null}
        title="Dismiss request"
        description={`Dismiss the manual import request from ${dismissTarget ? requesterName(dismissTarget.requestedByUser) : ""}?`}
        confirmLabel="Dismiss"
        confirmDisabled={dismissing}
        danger
        onConfirm={() => void onDismiss()}
        onCancel={() => { setDismissTarget(null); setDismissReason(""); }}
      >
        <textarea
          className="input mt-3 w-full min-h-[70px] resize-y text-sm"
          placeholder="Reason (optional)"
          value={dismissReason}
          onChange={(e) => setDismissReason(e.target.value)}
        />
      </ConfirmModal>
    </div>
  );
}

"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAppSelector } from "@/store/hooks";
import {
  useCreateRefundMutation,
  useGetRefundsQuery,
} from "@/store/routes/unified-commerce-api";
import { ErrorState, LoadingState, SuccessState } from "@/components/feedback/query-state";
import { getErrorMessage } from "@/lib/rtk-error";

export default function AdminRefundsPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: refunds, isLoading, isError, error } = useGetRefundsQuery(undefined, { skip: !token });
  const [createRefund, { isLoading: refundLoading }] = useCreateRefundMutation();
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  if (isLoading) return <LoadingState label="Loading refunds…" />;
  if (isError) return <ErrorState error={error} title="Could not load refunds" />;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Refunds</h1>
        <p className="mt-1 text-sm text-gray-500">
          Issue a refund for an order. The refund status updates automatically once your payment provider processes it.
        </p>
      </section>

      {notice?.ok && <SuccessState message={notice.text} />}
      {notice && !notice.ok && <ErrorState error={notice.text} title="Refund failed" />}

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Create refund</h2>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const orderId = String(fd.get("refund_orderId") ?? "").trim();
            const amount = String(fd.get("refund_amount") ?? "").trim();
            const reason = String(fd.get("refund_reason") ?? "").trim();
            if (!orderId || !amount) return;
            setNotice(null);
            try {
              await createRefund({ orderId, amount, reason: reason || undefined }).unwrap();
              setNotice({ ok: true, text: "Refund created." });
              (e.target as HTMLFormElement).reset();
            } catch (err) {
              setNotice({ ok: false, text: getErrorMessage(err) });
            }
          }}
        >
          <label className="block space-y-1 text-xs">
            <span className="font-medium text-gray-500">Order ID</span>
            <input
              className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10"
              name="refund_orderId"
              placeholder="Paste the order ID"
              required
            />
          </label>
          <label className="block space-y-1 text-xs">
            <span className="font-medium text-gray-500">Amount</span>
            <input
              className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10"
              name="refund_amount"
              placeholder="49.99"
              required
            />
          </label>
          <label className="block space-y-1 text-xs sm:col-span-2">
            <span className="font-medium text-gray-500">Reason (optional)</span>
            <input
              className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10"
              name="refund_reason"
              placeholder="Wrong item shipped"
            />
          </label>
          <div className="sm:col-span-4">
            <button
              type="submit"
              className="rounded-full border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              disabled={refundLoading}
            >
              {refundLoading ? "Creating…" : "Create refund"}
            </button>
          </div>
        </form>
      </section>

      {(refunds ?? []).length > 0 && (
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Refund history</h2>
          <div className="mt-4 space-y-3">
            {(refunds ?? []).map((r) => (
              <div key={r.id} className="rounded-xl border border-gray-100 p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="break-all font-mono text-xs text-gray-400">{r.id}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1 text-gray-700">
                  Order <span className="font-mono text-xs">{r.orderId}</span> &middot; Amount {r.amount}
                  {r.reason ? ` &middot; ${r.reason}` : ""}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

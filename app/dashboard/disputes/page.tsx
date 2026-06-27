"use client";

import { useState } from "react";
import { AlertCircle, ChevronRight, Plus, X } from "lucide-react";
import Link from "next/link";
import { ErrorState, LoadingState } from "@/components/feedback/query-state";
import {
  useCreatePriceDisputeMutation,
  useGetMyIssuesQuery,
  useGetOrdersQuery,
} from "@/store/routes/unified-commerce-api";
import { useAppSelector } from "@/store/hooks";
import { formatApiMoney } from "@/lib/format-price";
import { orderTotal } from "@/lib/dashboard-orders";
import type { IssueStatus, IssueType } from "@/types/api";
import { getErrorMessage } from "@/lib/rtk-error";

const STATUS_LABEL: Record<IssueStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  AWAITING_CUSTOMER: "Awaiting you",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const STATUS_COLOR: Record<IssueStatus, string> = {
  OPEN: "bg-amber-50 text-amber-700",
  IN_PROGRESS: "bg-teal-50 text-teal-700",
  AWAITING_CUSTOMER: "bg-lime-50 text-[#059669]",
  RESOLVED: "bg-emerald-50 text-emerald-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

const TYPE_LABEL: Partial<Record<IssueType, string>> = {
  PAYMENT_DISPUTE: "Payment dispute",
  REFUND_REQUEST: "Refund request",
  ITEM_NOT_RECEIVED: "Item not received",
  WRONG_ITEM: "Wrong item",
  DAMAGED_ITEM: "Damaged item",
  BILLING_ERROR: "Billing error",
  OTHER: "Other",
};

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function DisputesPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: issues, isLoading, isError, error } = useGetMyIssuesQuery(undefined, { skip: !token });
  const { data: orders } = useGetOrdersQuery(undefined, { skip: !token });
  const [createDispute, { isLoading: submitting }] = useCreatePriceDisputeMutation();

  const [showForm, setShowForm] = useState(false);
  const [formOrderId, setFormOrderId] = useState("");
  const [formExpected, setFormExpected] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formErr, setFormErr] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    if (!formOrderId) { setFormErr("Please select an order."); return; }
    if (!formReason.trim()) { setFormErr("Please describe the issue."); return; }
    try {
      await createDispute({
        orderId: formOrderId,
        expectedTotal: formExpected ? Number(formExpected) : undefined,
        reason: formReason.trim(),
      }).unwrap();
      setFormSuccess(true);
      setShowForm(false);
      setFormOrderId("");
      setFormExpected("");
      setFormReason("");
    } catch (err) {
      setFormErr(getErrorMessage(err));
    }
  };

  if (isLoading) return <LoadingState label="Loading your disputes…" />;
  if (isError) return <ErrorState error={error} title="Could not load disputes" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Disputes &amp; issues</h1>
          <p className="mt-1 text-sm text-gray-500">
            Report a billing error, missing item, or payment dispute.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setShowForm((v) => !v); setFormSuccess(false); setFormErr(null); }}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#059669] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#047857]"
        >
          {showForm ? <X className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
          {showForm ? "Cancel" : "New dispute"}
        </button>
      </div>

      {/* Success toast */}
      {formSuccess && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
          Dispute submitted. Our team will review it and follow up.
        </div>
      )}

      {/* New dispute form */}
      {showForm && (
        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-black/[0.07] bg-white p-6 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-gray-900">Open a new dispute</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Order
              </label>
              <select
                className="input"
                value={formOrderId}
                onChange={(e) => setFormOrderId(e.target.value)}
                required
              >
                <option value="">Select an order…</option>
                {orders?.map((o) => {
                  const { amount, currency } = orderTotal(o);
                  return (
                    <option key={o.id} value={o.id}>
                      {o.id.slice(0, 8)}… — {formatApiMoney(amount, currency)} — {o.status}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Expected total <span className="normal-case font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 49.99"
                className="input"
                value={formExpected}
                onChange={(e) => setFormExpected(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Describe the issue
              </label>
              <textarea
                rows={4}
                placeholder="E.g. I was charged for the 512 GB model but selected 256 GB…"
                className="input resize-none"
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                required
                maxLength={2048}
              />
              <p className="mt-1 text-right text-[11px] text-gray-400">{formReason.length}/2048</p>
            </div>

            {formErr && <p className="text-sm text-red-600">{formErr}</p>}

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? "Submitting…" : "Submit dispute"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Issues list */}
      {!issues || issues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-gray-50/60 py-14 text-center">
          <AlertCircle className="mx-auto h-9 w-9 text-gray-300" aria-hidden />
          <p className="mt-3 text-sm font-medium text-gray-500">No disputes on file</p>
          <p className="mt-1 text-xs text-gray-400">
            If you have an issue with an order, open a new dispute above.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {issues.map((issue) => (
            <li key={issue.id}>
              <div className="rounded-2xl border border-black/[0.07] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 line-clamp-1">{issue.subject}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {issue.type && (
                        <span className="text-xs text-gray-400">{TYPE_LABEL[issue.type] ?? issue.type}</span>
                      )}
                      {issue.orderId && (
                        <>
                          <span className="text-gray-300">·</span>
                          <Link
                            href={`/dashboard/orders/${issue.orderId}`}
                            className="inline-flex items-center gap-0.5 text-xs text-[#059669] hover:underline"
                          >
                            Order {issue.orderId.slice(0, 8)}…
                            <ChevronRight className="h-3 w-3" aria-hidden />
                          </Link>
                        </>
                      )}
                      {issue.createdAt && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-400">{formatDate(issue.createdAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${STATUS_COLOR[issue.status]}`}>
                    {STATUS_LABEL[issue.status]}
                  </span>
                </div>

                {issue.description && (
                  <p className="mt-3 text-sm text-gray-600 line-clamp-2">{issue.description}</p>
                )}

                {issue.resolutionNote && (
                  <div className="mt-3 rounded-xl bg-emerald-50 px-4 py-3">
                    <p className="text-xs font-semibold text-emerald-700">Resolution</p>
                    <p className="mt-1 text-sm text-emerald-700">{issue.resolutionNote}</p>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

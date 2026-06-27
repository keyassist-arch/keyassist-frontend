"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { LoadingState } from "@/components/feedback/query-state";
import {
  useCreateUserIssueMutation,
  useGetOrdersQuery,
} from "@/store/routes/unified-commerce-api";
import type { IssueType } from "@/types/api";
import { useAppSelector } from "@/store/hooks";
import { orderTotal } from "@/lib/dashboard-orders";
import { getErrorMessage } from "@/lib/rtk-error";
import Link from "next/link";

const TYPE_OPTIONS: { value: IssueType; label: string }[] = [
  { value: "REFUND_REQUEST", label: "Refund request" },
  { value: "ITEM_NOT_RECEIVED", label: "Item not received" },
  { value: "WRONG_ITEM", label: "Wrong item" },
  { value: "DAMAGED_ITEM", label: "Damaged item" },
  { value: "BILLING_ERROR", label: "Billing error" },
  { value: "PAYMENT_DISPUTE", label: "Payment dispute" },
  { value: "OTHER", label: "Other" },
];

export default function CreateTicketPage() {
  const router = useRouter();
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: orders, isLoading: ordersLoading } = useGetOrdersQuery(undefined, { skip: !token });
  const [createIssue, { isLoading: submitting }] = useCreateUserIssueMutation();

  const [orderId, setOrderId] = useState("");
  const [type, setType] = useState<IssueType>("OTHER");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [formErr, setFormErr] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErr(null);
    if (!subject.trim()) { setFormErr("Please enter a short subject."); return; }
    if (!description.trim()) { setFormErr("Please describe your issue."); return; }

    try {
      await createIssue({
        orderId: orderId || undefined,
        type,
        subject: subject.trim(),
        description: description.trim(),
      }).unwrap();
      setSubmitted(true);
    } catch (err) {
      setFormErr(getErrorMessage(err));
    }
  };

  if (!token) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Sign in to open a ticket</h1>
          <p className="mt-2 text-sm text-gray-500">You need to be signed in to submit a support request.</p>
          <Link href="/auth/login" className="mt-5 inline-flex rounded-full bg-[#059669] px-6 py-2.5 text-sm font-semibold text-white">
            Sign in
          </Link>
        </section>
      </div>
    );
  }

  if (ordersLoading) return <LoadingState label="Loading your orders…" />;

  if (submitted) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-8 text-center shadow-sm">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <Send className="h-5 w-5 text-emerald-600" aria-hidden />
          </div>
          <h1 className="mt-4 text-xl font-bold text-emerald-900">Ticket submitted</h1>
          <p className="mt-2 text-sm text-emerald-700">
            We&apos;ve received your request. Our support team will review it and follow up with you.
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard/disputes")}
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            View your tickets
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900">Create a support ticket</h1>
        <p className="mt-1 text-sm text-gray-500">
          Having trouble with an order? Tell us what happened and we&apos;ll help resolve it.
        </p>
      </section>

      <form onSubmit={onSubmit} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-5">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
            Issue type
          </label>
          <select
            className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10"
            value={type}
            onChange={(e) => setType(e.target.value as IssueType)}
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
            Related order <span className="normal-case font-normal text-gray-400">(optional)</span>
          </label>
          <select
            className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          >
            <option value="">No specific order</option>
            {orders?.map((o) => {
              const { amount, currency } = orderTotal(o);
              return (
                <option key={o.id} value={o.id}>
                  {o.id.slice(0, 8)}… — {currency} {amount.toFixed(2)} — {o.status.replaceAll("_", " ")}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
            Subject
          </label>
          <input
            className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10"
            placeholder="e.g. Never received my order"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            maxLength={256}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-400">
            Description
          </label>
          <textarea
            rows={5}
            placeholder="Tell us what happened in detail…"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10 resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={4096}
          />
          <p className="mt-1 text-right text-[11px] text-gray-400">{description.length}/4096</p>
        </div>

        {formErr && (
          <p className="text-sm text-red-600">{formErr}</p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-full bg-[#059669] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#047857] disabled:opacity-50"
          >
            <Send className="h-4 w-4" aria-hidden />
            {submitting ? "Submitting…" : "Submit ticket"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/disputes")}
            className="rounded-full border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

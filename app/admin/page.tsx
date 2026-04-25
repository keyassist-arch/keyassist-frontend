"use client";

import Link from "next/link";
import { FormEvent, useId, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { InnerShell } from "@/components/layout/inner-shell";
import { useAppSelector } from "@/store/hooks";
import {
  useCreateIssueMutation,
  useCreateRefundMutation,
  useGetAdminOrdersQuery,
  useGetAdminProductsQuery,
  useGetIssuesQuery,
  useGetMeQuery,
  useGetRefundsQuery,
  usePatchAdminOrderMutation,
  usePatchIssueMutation,
  usePostAdminScrapePreviewMutation,
  useResolveWithRefundMutation,
} from "@/store/routes/unified-commerce-api";
import type { IssueStatus, OrderStatus, PatchAdminOrderRequest } from "@/types/api";
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

export default function AdminPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: me, isLoading: meLoading } = useGetMeQuery(undefined, { skip: !token });
  const isAdmin = me?.role === "ADMIN_SUPER" || me?.role === "ADMIN_STAFF";

  const {
    data: adminOrders,
    isLoading: ordLoading,
    isError: ordErr,
    error: ordError,
  } = useGetAdminOrdersQuery(undefined, { skip: !token || !isAdmin });
  const {
    data: adminProducts,
    isLoading: prodLoading,
    isError: prodErr,
    error: prodError,
  } = useGetAdminProductsQuery(undefined, { skip: !token || !isAdmin });

  const [patchOrder, { isLoading: patching }] = usePatchAdminOrderMutation();
  const [scrapePreview, { isLoading: scraping, isError: scrapeErr, error: scrapeError }] =
    usePostAdminScrapePreviewMutation();
  const [createRefund, { isLoading: refundLoading }] = useCreateRefundMutation();
  const [createIssue, { isLoading: issueLoading }] = useCreateIssueMutation();
  const [patchIssue, { isLoading: patchingIssue }] = usePatchIssueMutation();
  const [resolveWithRefund, { isLoading: resolvingIssue }] = useResolveWithRefundMutation();

  const { data: refunds, isLoading: refundsLoading } = useGetRefundsQuery(undefined, { skip: !token || !isAdmin });
  const { data: issues, isLoading: issuesLoading } = useGetIssuesQuery(undefined, { skip: !token || !isAdmin });

  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewJson, setPreviewJson] = useState<string | null>(null);
  const previewUrlFieldId = useId();


  if (!token) {
    return (
      <InnerShell>
        <section className="card max-w-lg">
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="mt-2 text-sm text-black/70">Sign in with a staff account to open the admin panel.</p>
          <Link href="/auth/login" className="btn-primary mt-4 inline-block">
            Sign in
          </Link>
        </section>
      </InnerShell>
    );
  }

  if (meLoading) {
    return (
      <InnerShell>
        <LoadingState label="Checking role…" />
      </InnerShell>
    );
  }

  if (!isAdmin) {
    return (
      <InnerShell>
        <section className="card">
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="mt-2 text-sm text-black/70">Your account doesn't have permission to view this page.</p>
          <Link href="/dashboard" className="btn-secondary mt-4 inline-block">
            Back to account
          </Link>
        </section>
      </InnerShell>
    );
  }

  if (ordErr || prodErr) {
    return (
      <InnerShell>
        {ordErr ? <ErrorState error={ordError} title="Admin orders failed" /> : null}
        {prodErr ? <ErrorState error={prodError} title="Admin products failed" /> : null}
      </InnerShell>
    );
  }

  const loading = ordLoading || prodLoading || refundsLoading || issuesLoading;

  const onPatch = async (id: string, body: PatchAdminOrderRequest) => {
    setNotice(null);
    try {
      await patchOrder({ id, body }).unwrap();
      setNotice({ ok: true, text: "Order updated." });
    } catch (e) {
      setNotice({ ok: false, text: getErrorMessage(e) });
    }
  };

  const onScrapePreview = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPreviewJson(null);
    const u = previewUrl.trim();
    if (!u) return;
    try {
      const data = await scrapePreview({ url: u }).unwrap();
      setPreviewJson(JSON.stringify(data, null, 2));
    } catch {
      /* scrapeErr */
    }
  };

  return (
    <InnerShell>
      <div className="space-y-6">
        <section className="card">
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="mt-2 text-sm text-black/70">Manage orders, review catalog entries, and preview listings from a URL.</p>
        </section>

        {loading && <LoadingState label="Loading admin data…" />}
        {notice?.ok && <SuccessState message={notice.text} />}
        {notice && !notice.ok && <ErrorState error={notice.text} title="Update failed" />}

        <section className="grid gap-4 md:grid-cols-3">
          <article className="card">
            <h2 className="text-base font-semibold">Catalog items</h2>
            <p className="mt-2 text-2xl font-semibold">{adminProducts?.length ?? 0}</p>
          </article>
          <article className="card">
            <h2 className="text-base font-semibold">Orders</h2>
            <p className="mt-2 text-2xl font-semibold">{adminOrders?.length ?? 0}</p>
          </article>
          <article className="card">
            <h2 className="text-base font-semibold">Role</h2>
            <p className="mt-2 text-sm">
              {me?.role === "ADMIN_SUPER" ? "Super admin" : me?.role === "ADMIN_STAFF" ? "Staff" : me?.role}
            </p>
          </article>
        </section>

        <section className="card">
          <h2 className="text-lg font-semibold">Product preview</h2>
          <p className="mt-2 text-xs text-black/60">
            Preview how a product URL will appear before importing. Nothing is saved — use the shop to add items to your catalog.
          </p>
          <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onScrapePreview}>
            <label htmlFor={previewUrlFieldId} className="min-w-0 flex-1 space-y-1 text-sm">
              <span className="text-black/70">Product URL</span>
              <input
                id={previewUrlFieldId}
                className="input w-full"
                value={previewUrl}
                onChange={(e) => setPreviewUrl(e.target.value)}
                placeholder="https://..."
              />
            </label>
            <button type="submit" className="btn-secondary shrink-0" disabled={scraping}>
              {scraping ? "Fetching…" : "Run preview"}
            </button>
          </form>
          {scrapeErr ? (
            <div className="mt-4">
              <ErrorState error={scrapeError} title="Preview failed" />
            </div>
          ) : null}
          {previewJson ? (
            <pre className="mt-4 max-h-80 overflow-auto rounded-xl border border-black/10 bg-black/3 p-4 text-xs">
              {previewJson}
            </pre>
          ) : null}
        </section>

        <section className="card">
          <h2 className="text-xl font-semibold">Orders</h2>
          <div className="mt-4 space-y-4">
            {(adminOrders ?? []).map((order) => {
              const { amount, currency } = orderTotal(order);
              return (
                <article key={order.id} className="rounded-2xl border border-black/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="break-all text-sm tabular-nums text-black/80">{order.id}</p>
                      {order.userEmail ? <p className="text-xs text-black/50">{order.userEmail}</p> : null}
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-2 text-sm text-black/70">
                    Total {currency} {amount.toFixed(2)} · {order.items.length} lines
                  </p>
                  <label className="mt-3 block max-w-xs space-y-1 text-xs">
                    <span className="font-medium text-black/60">Order status</span>
                    <select
                      className="input w-full text-sm"
                      value={order.status}
                      disabled={patching}
                      onChange={(e) => {
                        const v = e.target.value as OrderStatus;
                        void onPatch(order.id, { status: v });
                      }}
                    >
                      {ADMIN_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <label className="block space-y-1 text-xs">
                      <span className="font-medium text-black/60">Tracking number</span>
                      <input
                        className="input w-full text-sm"
                        placeholder="e.g. 1Z999…"
                        defaultValue=""
                        id={`track-${order.id}`}
                      />
                    </label>
                    <label className="block space-y-1 text-xs">
                      <span className="font-medium text-black/60">Carrier</span>
                      <input
                        className="input w-full text-sm"
                        placeholder="e.g. DHL"
                        defaultValue=""
                        id={`carrier-${order.id}`}
                      />
                    </label>
                    <label className="block space-y-1 text-xs">
                      <span className="font-medium text-black/60">Note for customer</span>
                      <input
                        className="input w-full text-sm"
                        placeholder="e.g. Arrived at local hub"
                        defaultValue=""
                        id={`trackmsg-${order.id}`}
                      />
                    </label>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary mt-2 text-sm"
                    disabled={patching}
                    onClick={() => {
                      const tr = (document.getElementById(`track-${order.id}`) as HTMLInputElement | null)?.value?.trim();
                      const car = (document.getElementById(`carrier-${order.id}`) as HTMLInputElement | null)?.value?.trim();
                      const msg = (document.getElementById(`trackmsg-${order.id}`) as HTMLInputElement | null)?.value?.trim();
                      if (tr && car) void onPatch(order.id, { trackingNumber: tr, carrier: car, trackingMessage: msg || undefined });
                    }}
                  >
                    Add tracking
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Refunds ─────────────────────────────────────────────── */}
        <section className="card">
          <h2 className="text-xl font-semibold">Refunds</h2>
          <p className="mt-1 text-xs text-black/60">Issue a refund for an order. The refund status updates automatically once your payment provider processes it.</p>
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
              <span className="font-medium text-black/60">Order ID</span>
              <input className="input w-full text-sm" name="refund_orderId" placeholder="Paste the order ID" required />
            </label>
            <label className="block space-y-1 text-xs">
              <span className="font-medium text-black/60">Amount</span>
              <input className="input w-full text-sm" name="refund_amount" placeholder="49.99" required />
            </label>
            <label className="block space-y-1 text-xs sm:col-span-2">
              <span className="font-medium text-black/60">Reason (optional)</span>
              <input className="input w-full text-sm" name="refund_reason" placeholder="Wrong item shipped" />
            </label>
            <div className="sm:col-span-4">
              <button type="submit" className="btn-secondary text-sm" disabled={refundLoading}>
                {refundLoading ? "Creating…" : "Create refund"}
              </button>
            </div>
          </form>

          {(refunds ?? []).length > 0 ? (
            <div className="mt-6 space-y-3">
              {(refunds ?? []).map((r) => (
                <div key={r.id} className="rounded-xl border border-black/10 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="break-all font-mono text-xs text-black/60">{r.id}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 text-black/70">
                    Order <span className="font-mono text-xs">{r.orderId}</span> · Amount {r.amount}
                    {r.reason ? ` · ${r.reason}` : ""}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {/* ── Customer Issues ──────────────────────────────────────── */}
        <section className="card">
          <h2 className="text-xl font-semibold">Customer issues</h2>
          <p className="mt-1 text-xs text-black/60">Log and track support tickets for customers.</p>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const userId = String(fd.get("issue_userId") ?? "").trim();
              const subject = String(fd.get("issue_subject") ?? "").trim();
              const description = String(fd.get("issue_description") ?? "").trim();
              const orderId = String(fd.get("issue_orderId") ?? "").trim();
              if (!userId || !subject || !description) return;
              setNotice(null);
              try {
                await createIssue({ userId, subject, description, orderId: orderId || undefined }).unwrap();
                setNotice({ ok: true, text: "Issue created." });
                (e.target as HTMLFormElement).reset();
              } catch (err) {
                setNotice({ ok: false, text: getErrorMessage(err) });
              }
            }}
          >
            <label className="block space-y-1 text-xs">
              <span className="font-medium text-black/60">Customer ID</span>
              <input className="input w-full text-sm" name="issue_userId" placeholder="Paste the customer ID" required />
            </label>
            <label className="block space-y-1 text-xs">
              <span className="font-medium text-black/60">Related order (optional)</span>
              <input className="input w-full text-sm" name="issue_orderId" placeholder="Paste the order ID" />
            </label>
            <label className="block space-y-1 text-xs sm:col-span-2">
              <span className="font-medium text-black/60">Subject</span>
              <input className="input w-full text-sm" name="issue_subject" placeholder="Item not received" required />
            </label>
            <label className="block space-y-1 text-xs sm:col-span-2">
              <span className="font-medium text-black/60">Description</span>
              <textarea className="input w-full text-sm" name="issue_description" rows={3} required />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="btn-secondary text-sm" disabled={issueLoading}>
                {issueLoading ? "Creating…" : "Create issue"}
              </button>
            </div>
          </form>

          {(issues ?? []).length > 0 ? (
            <div className="mt-6 space-y-4">
              {(issues ?? []).map((issue) => (
                <div key={issue.id} className="rounded-xl border border-black/10 p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-shop-ink">{issue.subject}</p>
                      <p className="text-xs text-black/50 mt-0.5 font-mono">{issue.id}</p>
                    </div>
                    <StatusBadge status={issue.status} />
                  </div>
                  <p className="text-sm text-black/70">{issue.description}</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <label className="flex items-center gap-2 text-xs">
                      <span className="text-black/60">Status</span>
                      <select
                        className="input text-sm"
                        value={issue.status}
                        disabled={patchingIssue}
                        onChange={async (e) => {
                          setNotice(null);
                          try {
                            await patchIssue({ id: issue.id, body: { status: e.target.value as IssueStatus } }).unwrap();
                            setNotice({ ok: true, text: "Issue updated." });
                          } catch (err) {
                            setNotice({ ok: false, text: getErrorMessage(err) });
                          }
                        }}
                      >
                        {(["OPEN", "IN_PROGRESS", "AWAITING_CUSTOMER", "RESOLVED", "CLOSED"] as IssueStatus[]).map((s) => (
                          <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="btn-secondary text-xs"
                      disabled={resolvingIssue}
                      onClick={async () => {
                        const amount = window.prompt("Refund amount (e.g. 49.99):");
                        if (!amount) return;
                        setNotice(null);
                        try {
                          await resolveWithRefund({ id: issue.id, body: { amount, reason: issue.subject } }).unwrap();
                          setNotice({ ok: true, text: "Issue resolved with refund." });
                        } catch (err) {
                          setNotice({ ok: false, text: getErrorMessage(err) });
                        }
                      }}
                    >
                      {resolvingIssue ? "Processing…" : "Resolve + refund"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </InnerShell>
  );
}

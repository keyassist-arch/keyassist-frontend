"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { InnerShell } from "@/components/layout/inner-shell";
import { useAppSelector } from "@/store/hooks";
import {
  useGetAdminOrdersQuery,
  useGetAdminProductsQuery,
  useGetMeQuery,
  usePatchAdminOrderMutation,
  usePostAdminScrapePreviewMutation,
} from "@/store/routes/unified-commerce-api";
import type { OrderResponse, OrderStatus, PatchAdminOrderRequest } from "@/types/api";
import { ErrorState, LoadingState, SuccessState } from "@/components/feedback/query-state";
import { getErrorMessage } from "@/lib/rtk-error";

const ADMIN_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "ORDERED_FROM_SUPPLIER",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

function orderTotal(order: OrderResponse): { amount: number; currency: string } {
  const currency = order.items[0]?.currency ?? "—";
  const amount = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  return { amount, currency };
}

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
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewJson, setPreviewJson] = useState<string | null>(null);

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
          <p className="mt-2 text-sm text-black/70">Your role is {me?.role ?? "unknown"}. Admin UI is hidden.</p>
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

  const loading = ordLoading || prodLoading;

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
            <p className="mt-2 text-sm">{me?.role}</p>
          </article>
        </section>

        <section className="card">
          <h2 className="text-lg font-semibold">Listing preview</h2>
          <p className="mt-2 text-xs text-black/60">
            Fetch a read-only snapshot from a product URL. Nothing is saved to the catalog until you import from the storefront.
          </p>
          <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onScrapePreview}>
            <input
              className="input flex-1"
              value={previewUrl}
              onChange={(e) => setPreviewUrl(e.target.value)}
              placeholder="https://..."
              aria-label="Product URL to preview"
            />
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
            <pre className="mt-4 max-h-80 overflow-auto rounded-xl border border-black/10 bg-black/[0.03] p-4 text-xs">
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
                  <div className="mt-3 flex flex-wrap items-end gap-2">
                    <label className="text-xs font-medium text-black/60">Status</label>
                    <select
                      className="input max-w-xs text-sm"
                      value={order.status}
                      disabled={patching}
                      aria-label={`Status for ${order.id}`}
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
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input
                      className="input text-sm"
                      placeholder="Tracking #"
                      defaultValue=""
                      id={`track-${order.id}`}
                    />
                    <input className="input text-sm" placeholder="Carrier (e.g. DHL)" defaultValue="" id={`carrier-${order.id}`} />
                  </div>
                  <button
                    type="button"
                    className="btn-secondary mt-2 text-sm"
                    disabled={patching}
                    onClick={() => {
                      const tr = (document.getElementById(`track-${order.id}`) as HTMLInputElement | null)?.value?.trim();
                      const car = (document.getElementById(`carrier-${order.id}`) as HTMLInputElement | null)?.value?.trim();
                      if (tr && car) void onPatch(order.id, { trackingNumber: tr, carrier: car });
                    }}
                  >
                    Add tracking
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </InnerShell>
  );
}

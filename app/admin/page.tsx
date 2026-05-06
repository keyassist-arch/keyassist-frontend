"use client";

import Link from "next/link";
import { FormEvent, useId, useState } from "react";
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
        <LoadingState label="Verifying access…" />
      </InnerShell>
    );
  }

  if (!isAdmin) {
    return (
      <InnerShell>
        <section className="card">
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="mt-2 text-sm text-black/70">This page is only available to admin accounts. If you think this is a mistake, please contact support.</p>
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
        {ordErr ? <ErrorState error={ordError} title="Could not load orders" /> : null}
        {prodErr ? <ErrorState error={prodError} title="Could not load products" /> : null}
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

        {loading && <LoadingState label="Loading…" />}
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
            Preview a product from any URL. Nothing is saved to the catalog until you import it from the storefront.
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
                    Total {currency} {amount.toFixed(2)} · {order.items.length} items
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
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
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

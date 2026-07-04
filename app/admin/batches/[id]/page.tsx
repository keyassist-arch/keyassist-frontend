"use client";

import { use, useState } from "react";
import { ArrowLeft, ShoppingBag, ExternalLink, Bell, Check, Pencil } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAppSelector } from "@/store/hooks";
import {
  useGetAdminBatchItemsQuery,
  usePatchAdminWannaBuyQuoteMutation,
} from "@/store/routes/unified-commerce-api";
import { LoadingState, ErrorState } from "@/components/feedback/query-state";
import type { WannaBuyItem, WannaBuyItemStatus, AdminQuoteRequest } from "@/types/index";

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<WannaBuyItemStatus, { color: string; bg: string; label: string }> = {
  pending:   { color: "#d97706", bg: "#fef3c7", label: "Pending" },
  quoted:    { color: "#2563eb", bg: "#dbeafe", label: "Quoted" },
  confirmed: { color: "#7c3aed", bg: "#ede9fe", label: "Confirmed" },
  paid:      { color: "#059669", bg: "#d1fae5", label: "Paid" },
  ordered:   { color: "#0891b2", bg: "#cffafe", label: "Ordered" },
  cancelled: { color: "#dc2626", bg: "#fee2e2", label: "Cancelled" },
  expired:   { color: "#6b7280", bg: "#f3f4f6", label: "Expired" },
};

function StatusBadge({ status }: { status: WannaBuyItemStatus }) {
  const cfg = STATUS_COLOR[status] ?? STATUS_COLOR.pending;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </span>
  );
}

// ── Quote edit form ───────────────────────────────────────────────────────────

function QuoteForm({ item, onClose }: { item: WannaBuyItem; onClose: () => void }) {
  const [patch, { isLoading }] = usePatchAdminWannaBuyQuoteMutation();

  const [adminPrice, setAdminPrice] = useState(item.adminPriceUsd ?? item.scrapedPriceUsd ?? "");
  const [priceNote, setPriceNote] = useState(item.priceEditNote ?? "");
  const [tax, setTax] = useState(item.taxAmountUsd ?? "");
  const [shipping, setShipping] = useState(item.kingzShippingUsd ?? "");
  const [notify, setNotify] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: AdminQuoteRequest = {};
    if (adminPrice) body.adminPriceUsd = parseFloat(adminPrice);
    if (priceNote) body.priceEditNote = priceNote;
    if (tax) body.taxAmountUsd = parseFloat(tax);
    if (shipping) body.kingzShippingUsd = parseFloat(shipping);
    body.notifyUser = notify;

    try {
      await patch({ id: item.id, body }).unwrap();
      toast.success(notify ? "Quote saved and notification sent!" : "Quote saved");
      onClose();
    } catch {
      toast.error("Failed to save quote");
    }
  };

  const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-[#059669]/20";

  return (
    <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 mt-3">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Product price (USD)
            {item.scrapedPriceUsd && (
              <span className="ml-1.5 font-normal text-gray-400">
                scraped: ${parseFloat(item.scrapedPriceUsd).toFixed(2)}
              </span>
            )}
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={adminPrice}
            onChange={(e) => setAdminPrice(e.target.value)}
            placeholder="0.00"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Marketplace tax (USD)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
            placeholder="0.00"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Kingz shipping (USD)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={shipping}
            onChange={(e) => setShipping(e.target.value)}
            placeholder="0.00"
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Price edit note</label>
          <input
            type="text"
            value={priceNote}
            onChange={(e) => setPriceNote(e.target.value)}
            placeholder="Why was the price changed?"
            className={inputCls}
          />
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <div
          onClick={() => setNotify((v) => !v)}
          className={`flex h-5 w-5 items-center justify-center rounded transition ${notify ? "bg-[#059669]" : "border border-gray-300 bg-white"}`}
        >
          {notify && <Check className="h-3 w-3 text-white" aria-hidden />}
        </div>
        <span className="text-sm text-gray-700">Send quote notification to user</span>
      </label>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
          style={{ background: "#059669" }}
        >
          {isLoading ? "Saving…" : (
            <>
              {notify && <Bell className="h-4 w-4" aria-hidden />}
              {notify ? "Save & notify" : "Save quote"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ── Item row ─────────────────────────────────────────────────────────────────

function BatchItemRow({ item }: { item: WannaBuyItem }) {
  const [editing, setEditing] = useState(false);
  const effectivePrice = item.adminPriceUsd ?? item.scrapedPriceUsd;

  return (
    <article className="rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
      <div className="flex gap-4">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.productTitle ?? "Product"}
            className="h-16 w-16 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-100">
            <ShoppingBag className="h-6 w-6 text-gray-300" aria-hidden />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {item.productTitle ?? "Product"}
              </p>
              {item.marketplace && (
                <p className="mt-0.5 text-[11px] text-gray-400 capitalize">{item.marketplace.toLowerCase()}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={item.status} />
              <a
                href={item.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition"
                title="Open product URL"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>

          {item.variantSelection && Object.keys(item.variantSelection).length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {Object.entries(item.variantSelection).map(([k, v]) => (
                <span key={k} className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                  {k}: {v}
                </span>
              ))}
            </div>
          )}

          {/* Current pricing snapshot */}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
            {effectivePrice && (
              <span>
                Price: <strong className="text-gray-800">${parseFloat(effectivePrice).toFixed(2)}</strong>
                {item.adminPriceUsd && <span className="ml-1 text-amber-600">(edited)</span>}
              </span>
            )}
            {item.taxAmountUsd && (
              <span>Tax: <strong className="text-gray-800">${parseFloat(item.taxAmountUsd).toFixed(2)}</strong></span>
            )}
            {item.platformFeeUsd && (
              <span>Fee: <strong className="text-gray-800">${parseFloat(item.platformFeeUsd).toFixed(2)}</strong></span>
            )}
            {item.kingzShippingUsd && (
              <span>Shipping: <strong className="text-gray-800">${parseFloat(item.kingzShippingUsd).toFixed(2)}</strong></span>
            )}
            {item.totalUsd && (
              <span className="font-semibold text-gray-900">
                Total: ${parseFloat(item.totalUsd).toFixed(2)}
                {item.totalNgn && (
                  <span className="ml-1 text-[#059669]">
                    / ₦{parseFloat(item.totalNgn).toLocaleString("en-NG", { minimumFractionDigits: 0 })}
                  </span>
                )}
              </span>
            )}
          </div>

          {item.notifiedAt && (
            <p className="mt-1 text-[11px] text-gray-400">
              Notified {new Date(item.notifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          )}

          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#059669] hover:underline"
          >
            <Pencil className="h-3 w-3" aria-hidden />
            {editing ? "Close" : (item.totalUsd ? "Edit quote" : "Enter quote")}
          </button>
        </div>
      </div>

      {editing && <QuoteForm item={item} onClose={() => setEditing(false)} />}
    </article>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminBatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: items, isLoading, isError, error } = useGetAdminBatchItemsQuery(id, { skip: !token });

  if (isLoading) return <LoadingState label="Loading batch items…" />;
  if (isError) return <ErrorState error={error} title="Could not load batch items" />;

  const pending = items?.filter((i) => i.status === "pending") ?? [];
  const quoted = items?.filter((i) => i.status === "quoted") ?? [];
  const rest = items?.filter((i) => !["pending", "quoted"].includes(i.status)) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/batches"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Batches
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Batch items</h1>
      </div>

      <div className="flex gap-4 text-xs text-gray-500">
        <span><strong className="text-gray-900">{items?.length ?? 0}</strong> total</span>
        <span><strong className="text-amber-700">{pending.length}</strong> need quotes</span>
        <span><strong className="text-blue-700">{quoted.length}</strong> quoted</span>
      </div>

      {items?.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-gray-50/60 py-16 text-center">
          <ShoppingBag className="mx-auto h-8 w-8 text-gray-300" aria-hidden />
          <p className="mt-3 text-sm font-medium text-gray-500">No items in this batch yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-700">
                Needs quote ({pending.length})
              </h2>
              {pending.map((item) => <BatchItemRow key={item.id} item={item} />)}
            </section>
          )}
          {quoted.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-blue-700">
                Quoted — awaiting confirmation ({quoted.length})
              </h2>
              {quoted.map((item) => <BatchItemRow key={item.id} item={item} />)}
            </section>
          )}
          {rest.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                Other ({rest.length})
              </h2>
              {rest.map((item) => <BatchItemRow key={item.id} item={item} />)}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

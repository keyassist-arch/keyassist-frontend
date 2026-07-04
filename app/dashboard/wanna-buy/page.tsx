"use client";

import { useState } from "react";
import { Heart, Plus, ExternalLink, Clock, CheckCircle2, ShoppingBag, XCircle, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAppSelector } from "@/store/hooks";
import {
  useGetWannaBuyItemsQuery,
  useAddWannaBuyItemMutation,
  usePayWannaBuyItemMutation,
  useGetMeQuery,
} from "@/store/routes/unified-commerce-api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingState, ErrorState } from "@/components/feedback/query-state";
import { useWannaBuyRealtime } from "@/hooks/use-wanna-buy-realtime";
import type { WannaBuyItem, WannaBuyItemStatus } from "@/types/index";

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  WannaBuyItemStatus,
  { label: string; color: string; bg: string; Icon: React.ElementType }
> = {
  pending:   { label: "Pending",   color: "#d97706", bg: "#fef3c7", Icon: Clock         },
  quoted:    { label: "Quoted",    color: "#2563eb", bg: "#dbeafe", Icon: AlertCircle   },
  confirmed: { label: "Confirmed", color: "#7c3aed", bg: "#ede9fe", Icon: CheckCircle2  },
  paid:      { label: "Paid",      color: "#059669", bg: "#d1fae5", Icon: CheckCircle2  },
  ordered:   { label: "Ordered",   color: "#0891b2", bg: "#cffafe", Icon: ShoppingBag   },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fee2e2", Icon: XCircle       },
  expired:   { label: "Expired",   color: "#6b7280", bg: "#f3f4f6", Icon: XCircle       },
};

function StatusBadge({ status }: { status: WannaBuyItemStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.Icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {cfg.label}
    </span>
  );
}

// ── Price display ─────────────────────────────────────────────────────────────

function fmt(val: string | null, prefix = "$") {
  if (!val) return null;
  return `${prefix}${parseFloat(val).toFixed(2)}`;
}

function fmtNgn(val: string | null) {
  if (!val) return null;
  return `₦${parseFloat(val).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

// ── Item card ─────────────────────────────────────────────────────────────────

function WannaBuyCard({ item, onPay, phoneVerificationBlocked }: { item: WannaBuyItem; onPay?: (id: string) => void; phoneVerificationBlocked?: boolean }) {
  const effectivePrice = item.adminPriceUsd ?? item.scrapedPriceUsd;

  return (
    <article className="flex gap-4 rounded-2xl border border-black/[0.06] bg-white p-4 shadow-sm">
      {/* Thumbnail */}
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

      {/* Details */}
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
          <StatusBadge status={item.status} />
        </div>

        {/* Variant tags */}
        {item.variantSelection && Object.keys(item.variantSelection).length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {Object.entries(item.variantSelection).map(([k, v]) => (
              <span key={k} className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                {k}: {v}
              </span>
            ))}
          </div>
        )}

        {/* Quote breakdown — only when quoted/confirmed/paid */}
        {item.totalUsd && (
          <div className="mt-3 rounded-xl bg-gray-50 px-3 py-2.5 text-xs text-gray-600 space-y-1">
            {effectivePrice && <div className="flex justify-between"><span>Product price</span><span className="font-medium">{fmt(effectivePrice)}</span></div>}
            {item.taxAmountUsd && <div className="flex justify-between"><span>Tax</span><span className="font-medium">{fmt(item.taxAmountUsd)}</span></div>}
            {item.platformFeeUsd && <div className="flex justify-between"><span>Platform fee</span><span className="font-medium">{fmt(item.platformFeeUsd)}</span></div>}
            {item.kingzShippingUsd && <div className="flex justify-between"><span>International shipping</span><span className="font-medium">{fmt(item.kingzShippingUsd)}</span></div>}
            <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold text-gray-900">
              <span>Total</span>
              <span>{fmt(item.totalUsd)}</span>
            </div>
            {item.totalNgn && (
              <div className="flex justify-between text-[#059669] font-semibold">
                <span>Total (NGN)</span>
                <span>{fmtNgn(item.totalNgn)}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer row */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-[11px] text-gray-400">
            Added {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
          <a
            href={item.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#059669] hover:underline"
          >
            View product <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </div>

        {/* Quoted — pay CTA */}
        {item.status === "quoted" && (
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs text-blue-700 mb-2">
              Your quote is ready. Confirm and pay before Wednesday to be included in this week&apos;s batch.
            </p>
            {phoneVerificationBlocked && (
              <p className="text-xs text-amber-700 mb-2">
                Verify your phone number via WhatsApp in{" "}
                <Link href="/dashboard/settings" className="font-semibold underline">
                  Settings
                </Link>{" "}
                before you can pay.
              </p>
            )}
            {onPay && (
              <button
                type="button"
                disabled={phoneVerificationBlocked}
                onClick={() => onPay(item.id)}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "#059669" }}
              >
                Confirm &amp; Pay
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// ── Add item modal ────────────────────────────────────────────────────────────

function AddItemModal({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [variantKey, setVariantKey] = useState("");
  const [variantValue, setVariantValue] = useState("");
  const [addItem, { isLoading }] = useAddWannaBuyItemMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const variantSelection: Record<string, string> = {};
    if (variantKey.trim() && variantValue.trim()) {
      variantSelection[variantKey.trim()] = variantValue.trim();
    }

    try {
      await addItem({
        productUrl: url.trim(),
        ...(Object.keys(variantSelection).length > 0 ? { variantSelection } : {}),
      }).unwrap();
      toast.success("Added to your Wanna Buy list!");
      onClose();
    } catch {
      toast.error("Failed to add item. Please check the URL and try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-gray-900">Add to Wanna Buy</h2>
        <p className="mt-1 text-sm text-gray-500">
          Paste a product link from any marketplace. We&apos;ll scrape the price and get back to you with a full quote.
        </p>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Product URL *</label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.amazon.com/dp/..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-[#059669]/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Variant (optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={variantKey}
                onChange={(e) => setVariantKey(e.target.value)}
                placeholder="e.g. Size"
                className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-[#059669]/20"
              />
              <input
                type="text"
                value={variantValue}
                onChange={(e) => setVariantValue(e.target.value)}
                placeholder="e.g. 10"
                className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-[#059669]/20"
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-400">Specify size, color, storage, etc. if needed.</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
              style={{ background: "#059669" }}
            >
              {isLoading ? "Adding…" : "Add item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function WannaBuyPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: items, isLoading, isError, error, refetch } = useGetWannaBuyItemsQuery(undefined, { skip: !token });
  const { data: me } = useGetMeQuery(undefined, { skip: !token });
  const [showModal, setShowModal] = useState(false);
  const [payItem, { isLoading: paying }] = usePayWannaBuyItemMutation();
  const router = useRouter();

  useWannaBuyRealtime(token, () => {
    void refetch();
  });

  const phoneVerificationBlocked = Boolean(me?.phoneVerificationRequired && !me?.phoneVerified);

  const handlePay = async (itemId: string) => {
    if (phoneVerificationBlocked) {
      toast.error("Verify your phone number via WhatsApp in Settings before checking out.");
      return;
    }
    try {
      const order = await payItem(itemId).unwrap();
      router.push(`/checkout?resume=${order.id}`);
    } catch {
      toast.error("Could not initiate payment. Please try again.");
    }
  };

  if (isLoading) return <LoadingState label="Loading your Wanna Buy list…" />;
  if (isError) return <ErrorState error={error} title="Could not load your Wanna Buy list" />;

  const active = items?.filter((i) => !["cancelled", "expired"].includes(i.status)) ?? [];
  const past = items?.filter((i) => ["cancelled", "expired"].includes(i.status)) ?? [];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Wanna Buy</h1>
            <p className="mt-1 text-sm text-gray-500">
              Share a product link — we&apos;ll source it, compute the total landed cost, and send you a quote.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ background: "#059669" }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add item
          </button>
        </div>

        {/* How it works banner */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-2">How it works</p>
          <ol className="grid gap-1 sm:grid-cols-4 text-xs text-emerald-800">
            <li className="flex items-start gap-1.5"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">1</span>Paste a product link below.</li>
            <li className="flex items-start gap-1.5"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">2</span>We quote price + tax + shipping by Tuesday.</li>
            <li className="flex items-start gap-1.5"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">3</span>Confirm &amp; pay before Wednesday.</li>
            <li className="flex items-start gap-1.5"><span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">4</span>Delivered to you in 10–15 days.</li>
          </ol>
        </div>

        {/* Active items */}
        {active.length === 0 && past.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/10 bg-gray-50/60 py-16 text-center">
            <Heart className="mx-auto h-8 w-8 text-gray-300" aria-hidden />
            <p className="mt-3 text-sm font-medium text-gray-500">Your Wanna Buy list is empty</p>
            <p className="mt-1 text-xs text-gray-400">Add a product link from any marketplace to get started.</p>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "#059669" }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add your first item
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {active.map((item) => (
              <WannaBuyCard key={item.id} item={item} onPay={paying ? undefined : handlePay} phoneVerificationBlocked={phoneVerificationBlocked} />
            ))}
          </div>
        )}

        {/* Past items */}
        {past.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Past</h2>
            {past.map((item) => (
              <WannaBuyCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {showModal && <AddItemModal onClose={() => setShowModal(false)} />}
    </>
  );
}

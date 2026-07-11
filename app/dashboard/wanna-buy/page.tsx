"use client";

import { useMemo, useState } from "react";
import { Heart, Plus, ExternalLink, Clock, CheckCircle2, ShoppingBag, XCircle, AlertCircle, Search } from "lucide-react";
import toast from "react-hot-toast";
import { useAppSelector } from "@/store/hooks";
import {
  useGetWannaBuyItemsQuery,
  useAddWannaBuyItemMutation,
  usePayWannaBuyItemsMutation,
  useGetMeQuery,
  useGetCatalogProductsQuery,
  useGetCurrentWannaBuyBatchQuery,
} from "@/store/routes/unified-commerce-api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingState, ErrorState } from "@/components/feedback/query-state";
import { useWannaBuyRealtime } from "@/hooks/use-wanna-buy-realtime";
import { productDetailPath } from "@/lib/product-detail-path";
import { formatApiMoney } from "@/lib/format-price";
import { getVariantDimensions } from "@/lib/api-product-variants";
import { normalizeImageUrls } from "@/lib/normalize-image-urls";
import { retailerLabelFromSource } from "@/lib/product-source";
import { BatchRolloverModal } from "@/components/wanna-buy/batch-rollover-modal";
import type { WannaBuyItem, WannaBuyItemStatus, BatchRolloverInfo } from "@/types/index";
import type { ApiProduct } from "@/types/api";

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

function WannaBuyCard({
  item,
  selected,
  onToggleSelect,
  phoneVerificationBlocked,
}: {
  item: WannaBuyItem;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
  phoneVerificationBlocked?: boolean;
}) {
  const effectivePrice = item.adminPriceUsd ?? item.scrapedPriceUsd;
  const selectable = item.status === "quoted" && Boolean(onToggleSelect);

  return (
    <article
      className={`flex gap-4 rounded-2xl border bg-white p-4 shadow-sm transition ${
        selected ? "border-[#059669] ring-1 ring-[#059669]/30" : "border-black/[0.06]"
      }`}
    >
      {/* Select checkbox */}
      {selectable && (
        <button
          type="button"
          onClick={() => onToggleSelect?.(item.id)}
          aria-pressed={selected}
          aria-label={selected ? "Deselect item" : "Select item"}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
            selected ? "border-[#059669] bg-[#059669]" : "border-gray-300 bg-white"
          }`}
        >
          {selected && <CheckCircle2 className="h-3.5 w-3.5 text-white" aria-hidden />}
        </button>
      )}

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

        {/* Quoted — select to pay */}
        {item.status === "quoted" && (
          <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs text-blue-700">
              Your quote is ready. Select this item above and confirm &amp; pay to be included in this week&apos;s batch.
            </p>
            {phoneVerificationBlocked && (
              <p className="mt-2 text-xs text-amber-700">
                Verify your phone number via WhatsApp in{" "}
                <Link href="/dashboard/settings" className="font-semibold underline">
                  Settings
                </Link>{" "}
                before you can pay.
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// ── Add item modal ────────────────────────────────────────────────────────────

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-[#059669]/20";

function ProductPickerResults({
  products,
  query,
  selectedId,
  onSelect,
}: {
  products: ApiProduct[];
  query: string;
  selectedId: string | null;
  onSelect: (p: ApiProduct) => void;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? products.filter((p) => p.title.toLowerCase().includes(q)) : products;
    return list.slice(0, 30);
  }, [products, query]);

  if (filtered.length === 0) {
    return <p className="py-8 text-center text-xs text-gray-400">No matching products.</p>;
  }

  return (
    <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
      {filtered.map((p) => {
        const image = normalizeImageUrls(p.images)[0];
        const price = p.salePrice ?? p.originalPrice;
        const active = p.id === selectedId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p)}
            className={`flex w-full items-center gap-3 rounded-xl border px-2.5 py-1.5 text-left transition ${
              active ? "border-[#059669] bg-emerald-50" : "border-transparent hover:bg-gray-50"
            }`}
          >
            {image ? (
              <img src={image} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <ShoppingBag className="h-4 w-4 text-gray-300" aria-hidden />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-gray-900">{p.title}</p>
              <p className="text-[11px] text-gray-400">{formatApiMoney(price, p.currency)}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ProductPreview({
  product,
  variantSelection,
  onVariantChange,
}: {
  product: ApiProduct;
  variantSelection: Record<string, string>;
  onVariantChange: (name: string, value: string) => void;
}) {
  const image = normalizeImageUrls(product.images)[0];
  const price = product.salePrice ?? product.originalPrice;
  const dimensions = useMemo(() => getVariantDimensions(product), [product]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3.5">
      <div className="h-28 w-full overflow-hidden rounded-xl bg-white">
        {image ? (
          <img src={image} alt={product.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-gray-300" aria-hidden />
          </div>
        )}
      </div>
      <p className="mt-2.5 line-clamp-2 text-sm font-semibold text-gray-900">{product.title}</p>
      <p className="mt-0.5 text-[11px] text-gray-400">{retailerLabelFromSource(product.source)}</p>
      <p className="mt-1.5 text-sm font-semibold text-[#059669]">{formatApiMoney(price, product.currency)}</p>

      {dimensions.length > 0 && (
        <div className="mt-3 space-y-2">
          {dimensions.map((dim) => (
            <div key={dim.name}>
              <label className="mb-1 block text-[11px] font-semibold text-gray-700">{dim.name}</label>
              <select
                value={variantSelection[dim.name] ?? ""}
                onChange={(e) => onVariantChange(dim.name, e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-[#059669]/20"
              >
                <option value="">Select {dim.name.toLowerCase()}</option>
                {dim.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddItemModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (rollover: BatchRolloverInfo | null) => void;
}) {
  const [mode, setMode] = useState<"url" | "product">("url");
  const [url, setUrl] = useState("");
  const [variantKey, setVariantKey] = useState("");
  const [variantValue, setVariantValue] = useState("");
  const [query, setQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null);
  const [productVariantSelection, setProductVariantSelection] = useState<Record<string, string>>({});
  const [addItem, { isLoading }] = useAddWannaBuyItemMutation();
  const { data: catalogProducts, isFetching: catalogLoading } = useGetCatalogProductsQuery(undefined, {
    skip: mode !== "product",
  });

  const handleSelectProduct = (p: ApiProduct) => {
    setSelectedProduct(p);
    setProductVariantSelection({});
  };

  const canSubmit = mode === "url" ? Boolean(url.trim()) : Boolean(selectedProduct);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let productUrl: string;
    let variantSelection: Record<string, string> = {};
    let productTitle: string | undefined;
    let imageUrl: string | undefined;

    if (mode === "url") {
      if (!url.trim()) return;
      productUrl = url.trim();
      if (variantKey.trim() && variantValue.trim()) {
        variantSelection[variantKey.trim()] = variantValue.trim();
      }
    } else {
      if (!selectedProduct) return;
      productUrl =
        selectedProduct.sourceUrl?.trim() ||
        selectedProduct.scrapeUrl?.trim() ||
        `${window.location.origin}${productDetailPath(selectedProduct)}`;
      variantSelection = Object.fromEntries(
        Object.entries(productVariantSelection).filter(([, v]) => v.trim()),
      );
      // Already known from the catalog — skip the backend scrape, admin confirms price separately.
      productTitle = selectedProduct.title;
      imageUrl = normalizeImageUrls(selectedProduct.images)[0];
    }

    try {
      const result = await addItem({
        productUrl,
        ...(Object.keys(variantSelection).length > 0 ? { variantSelection } : {}),
        ...(productTitle ? { productTitle } : {}),
        ...(imageUrl ? { imageUrl } : {}),
      }).unwrap();
      if (!result.batchRollover) {
        toast.success("Added to your Wanna Buy list!");
      }
      onAdded(result.batchRollover);
      onClose();
    } catch {
      toast.error("Failed to add item. Please check the URL and try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl ${
          mode === "product" ? "max-w-3xl sm:max-w-4xl" : "max-w-md"
        }`}
      >
        <h2 className="text-lg font-bold text-gray-900">Add to Wanna Buy</h2>
        <p className="mt-1 text-sm text-gray-500">
          Paste a product link from any marketplace, or pick something already on the platform. We&apos;ll get back
          to you with a full quote.
        </p>

        <div className="mt-3 inline-flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              mode === "url" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Paste a link
          </button>
          <button
            type="button"
            onClick={() => setMode("product")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
              mode === "product" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Choose from platform
          </button>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="mt-4 space-y-3">
          {mode === "url" ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Product URL *</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.amazon.com/dp/..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Variant (optional)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={variantKey}
                    onChange={(e) => setVariantKey(e.target.value)}
                    placeholder="e.g. Size"
                    className={inputClass}
                  />
                  <input
                    type="text"
                    value={variantValue}
                    onChange={(e) => setVariantValue(e.target.value)}
                    placeholder="e.g. 10"
                    className={inputClass}
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-400">Specify size, color, storage, etc. if needed.</p>
              </div>
            </>
          ) : (
            <div className="grid min-w-0 gap-4 sm:grid-cols-[1.15fr_1fr]">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Search products</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by product name…"
                    className={`${inputClass} pl-9`}
                  />
                </div>
                <div className="mt-2">
                  {catalogLoading ? (
                    <p className="py-8 text-center text-xs text-gray-400">Loading products…</p>
                  ) : (
                    <ProductPickerResults
                      products={catalogProducts ?? []}
                      query={query}
                      selectedId={selectedProduct?.id ?? null}
                      onSelect={handleSelectProduct}
                    />
                  )}
                </div>
              </div>

              <div className="min-w-0">
                {selectedProduct ? (
                  <ProductPreview
                    product={selectedProduct}
                    variantSelection={productVariantSelection}
                    onVariantChange={(name, value) =>
                      setProductVariantSelection((prev) => ({ ...prev, [name]: value }))
                    }
                  />
                ) : (
                  <div className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 px-4 text-center">
                    <ShoppingBag className="h-6 w-6 text-gray-300" aria-hidden />
                    <p className="mt-2 text-xs text-gray-400">Select a product to preview it here.</p>
                  </div>
                )}
              </div>
            </div>
          )}

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
              disabled={isLoading || !canSubmit}
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
  const { data: currentBatch } = useGetCurrentWannaBuyBatchQuery(undefined, { skip: !token });
  const [showModal, setShowModal] = useState(false);
  const [rollover, setRollover] = useState<BatchRolloverInfo | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [payItems, { isLoading: paying }] = usePayWannaBuyItemsMutation();
  const router = useRouter();

  useWannaBuyRealtime(token, () => {
    void refetch();
  });

  const phoneVerificationBlocked = Boolean(me?.phoneVerificationRequired && !me?.phoneVerified);

  const toggleSelect = (itemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const selectedItems = items?.filter((i) => selectedIds.has(i.id)) ?? [];
  const selectedTotal = selectedItems.reduce((sum, i) => sum + parseFloat(i.totalUsd ?? "0"), 0);

  const handlePaySelected = async () => {
    if (phoneVerificationBlocked) {
      toast.error("Verify your phone number via WhatsApp in Settings before checking out.");
      return;
    }
    if (selectedIds.size === 0) return;
    try {
      const order = await payItems({ itemIds: [...selectedIds] }).unwrap();
      setSelectedIds(new Set());
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
          {currentBatch?.collectingEndsAt && (
            <p className="mt-3 border-t border-emerald-100 pt-2 text-[11px] text-emerald-700">
              This week&apos;s batch closes for new items{" "}
              <strong>
                {new Date(currentBatch.collectingEndsAt).toLocaleString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </strong>
              . Items added after that land in the next batch.
            </p>
          )}
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
          <div className="space-y-3 pb-20">
            {active.map((item) => (
              <WannaBuyCard
                key={item.id}
                item={item}
                selected={selectedIds.has(item.id)}
                onToggleSelect={toggleSelect}
                phoneVerificationBlocked={phoneVerificationBlocked}
              />
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

      {selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/[0.06] bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-700">
              <strong>{selectedIds.size}</strong> selected · Total{" "}
              <strong className="text-gray-900">${selectedTotal.toFixed(2)}</strong>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={paying || phoneVerificationBlocked}
                onClick={() => { void handlePaySelected(); }}
                className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "#059669" }}
              >
                {paying ? "Processing…" : "Confirm & Pay"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && <AddItemModal onClose={() => setShowModal(false)} onAdded={setRollover} />}
      <BatchRolloverModal info={rollover} onClose={() => setRollover(null)} />
    </>
  );
}

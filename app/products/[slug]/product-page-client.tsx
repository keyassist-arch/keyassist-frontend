"use client";

import Link from "next/link";
import { Check, Heart, Share2, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useCart } from "@/context/cart-context";
import { OpenCartTrigger } from "@/components/cart/open-cart-trigger";
import { useAppSelector } from "@/store/hooks";
import { useAddCartItemMutation, useGetProductQuery } from "@/store/routes/unified-commerce-api";
import { defaultVariantSelection, getVariantDimensions } from "@/lib/api-product-variants";
import { ErrorState, LoadingState } from "@/components/feedback/query-state";
import { getErrorMessage } from "@/lib/rtk-error";
import { coerceNumber } from "@/lib/coerce-number";
import { splitProductDescription } from "@/lib/product-description-sections";
import { buildProductDetailZonesFromApi } from "@/lib/build-product-detail-zones";
import { ProductDetailLayout } from "@/components/product/product-detail-layout";
import { ProductQuantityStepper } from "@/components/product/product-quantity-stepper";
import { InnerShell } from "@/components/layout/inner-shell";
import { RelatedProducts } from "@/components/product/related-products";
import { formatApiMoney, pricesAreEqual } from "@/lib/format-price";
import { marketplaceFromApiSource, retailerLabelFromSource } from "@/lib/product-source";
import type { Product, ProductVariant } from "@/types";
import type { ApiConfigurationPrice, ApiProduct } from "@/types/api";
import type { ProductDetailCrumb, ProductDetailDescriptionBlock, ProductDetailVariantSlot } from "@/types/product-detail";

const UNLIMITED_LOCAL_STOCK = 999_999;

export function ProductPageClient() {
  const params = useParams<{ slug: string }>();
  const raw = params.slug ?? "";
  let segment = raw;
  try {
    segment = decodeURIComponent(raw);
  } catch {
    segment = raw;
  }
  segment = segment.trim();

  if (!segment) {
    return (
      <InnerShell>
        <section className="card">
          <h1 className="text-xl font-semibold">Product not found</h1>
          <p className="mt-2 text-sm text-black/70">We couldn&rsquo;t find that product. Start from the shop and open a listing from the grid.</p>
          <Link href="/shop" className="btn-secondary mt-4 inline-block">Browse shop</Link>
        </section>
      </InnerShell>
    );
  }

  return <ApiProductDetail idOrSlug={segment} />;
}

// ─── Adapter detection ────────────────────────────────────────────────────────

function isGoat(source?: string | null)   { return source === "goat"; }
function isApple(source?: string | null)  { return source === "apple"; }
function isAmazon(source?: string | null) { return source === "amazon"; }
function isZara(source?: string | null)   { return source === "zara"; }
function isStockX(source?: string | null) { return source === "stockx"; }
function isEbay(source?: string | null)   { return source === "ebay"; }
function isNike(source?: string | null)   { return source === "nike"; }

// ─── eBay description helpers ─────────────────────────────────────────────────

function parseConditionFromDescription(desc?: string | null): string | null {
  if (!desc) return null;
  const m = desc.match(/Condition:\s*(.+?)(?:\n|$)/);
  return m?.[1]?.trim() ?? null;
}

function parseShippingFromDescription(desc?: string | null): string | null {
  if (!desc) return null;
  const m = desc.match(/Shipping:\s*(.+?)(?:\n|$)/);
  return m?.[1]?.trim() ?? null;
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

const SWATCH_BG = ["#9ca3af", "#d6c4a8", "#374151", "#e8e4df", "#78716c", "#b45309", "#0d9488"];

function swatchColorForOption(opt: string, index: number) {
  let h = 0;
  for (let i = 0; i < opt.length; i++) h = (h + opt.charCodeAt(i) * (i + 1)) % 997;
  return SWATCH_BG[(h + index) % SWATCH_BG.length];
}

function isColorLikeDimension(name: string) {
  return /color|colour|finish/i.test(name.trim());
}

function stableRatingCount(productId: string) {
  const hex = productId.replace(/-/g, "").slice(4, 12);
  const n = parseInt(hex, 16);
  const base = Number.isFinite(n) ? n % 350 : 0;
  return 47 + base;
}

function stableRating(productId: string) {
  const hex = productId.replace(/-/g, "").slice(12, 16);
  const n = parseInt(hex, 16);
  const base = Number.isFinite(n) ? (n % 10) / 10 : 0;
  return Math.round((3.5 + base * 1.5) * 2) / 2;
}

// ─── Configuration prices table (for Amazon and generic adapters) ─────────────

function configurationRowLabel(row: ApiConfigurationPrice): string {
  const primary = row.displayLabel?.trim() || row.label?.trim();
  if (primary) return primary;
  if (row.variantAxis?.trim() && row.optionValue?.trim()) return `${row.variantAxis}: ${row.optionValue}`;
  return "—";
}

function ConfigurationPricesTable({ rows, currency }: { rows: ApiConfigurationPrice[]; currency: string }) {
  const showSkuCol = rows.some((r) => Boolean(r.partNumber?.trim() || r.sku?.trim()));
  const showOos = rows.some((r) => r.available === false);
  return (
    <table className="w-full min-w-[min(100%,320px)] border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-black/10 text-xs uppercase tracking-wide text-shop-muted">
          <th className="py-2 pr-3 font-medium">Configuration</th>
          {showSkuCol ? <th className="py-2 pr-3 font-medium">Part / SKU</th> : null}
          <th className="py-2 font-medium">Price</th>
          {showOos ? <th className="py-2 pl-2 font-medium">Stock</th> : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const saleRaw = row.salePrice ?? row.originalPrice;
          const orig = coerceNumber(row.originalPrice, 0);
          const sale = coerceNumber(saleRaw, 0);
          const showStrike = orig > 0 && sale > 0 && !pricesAreEqual(row.originalPrice, row.salePrice);
          const sku = row.partNumber?.trim() || row.sku?.trim();
          const rowCurrency = row.currency?.trim() || currency;
          return (
            <tr key={i} className="border-b border-black/5 last:border-b-0">
              <td className="py-2.5 pr-3 align-top text-shop-ink">{configurationRowLabel(row)}</td>
              {showSkuCol ? <td className="py-2.5 pr-3 align-top tabular-nums text-black/70">{sku ?? "—"}</td> : null}
              <td className="py-2.5 align-top tabular-nums">
                {showStrike ? <span className="mr-2 text-black/40 line-through">{formatApiMoney(row.originalPrice, rowCurrency)}</span> : null}
                <span className="font-medium text-shop-ink">{formatApiMoney(saleRaw, rowCurrency)}</span>
              </td>
              {showOos ? (
                <td className="py-2.5 pl-2 align-top text-xs text-shop-muted">
                  {row.available === false ? <span className="text-amber-800">Out of stock</span> : "—"}
                </td>
              ) : null}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Description helpers ──────────────────────────────────────────────────────

function buildDescriptionBlocks(api: ApiProduct): ProductDetailDescriptionBlock[] {
  const { summary, blocks } = splitProductDescription(api.description);
  const out: ProductDetailDescriptionBlock[] = [];
  if (summary) {
    const paras = summary.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    out.push({
      content: (
        <div className="space-y-3">
          {paras.map((p, i) => <p key={i} className="whitespace-pre-wrap text-shop-ink">{p}</p>)}
        </div>
      ),
    });
  }
  for (const b of blocks) {
    out.push({ title: b.title, content: <pre className="whitespace-pre-wrap font-sans text-shop-ink">{b.body}</pre> });
  }
  return out;
}

function formatFreshLine(api: ApiProduct): string | null {
  const scraped = api.lastScrapedAt?.trim();
  const verified = api.lastVerifiedAt?.trim();
  try {
    if (verified) return `Last verified ${new Date(verified).toLocaleString()}`;
    if (scraped) return `Last updated ${new Date(scraped).toLocaleString()}`;
  } catch { return null; }
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

function ApiProductDetail({ idOrSlug }: { idOrSlug: string }) {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { addItem } = useCart();
  const { data: api, isLoading, isError, error } = useGetProductQuery(idOrSlug);
  const [addCartItem, { isLoading: adding }] = useAddCartItemMutation();
  const [quantity, setQuantity] = useState(1);
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState("");
  const [stockxFetchingPrice, setStockxFetchingPrice] = useState(false);
  const [stockxLivePrice, setStockxLivePrice] = useState<string | null>(null);

  const dimensions = useMemo(() => (api ? getVariantDimensions(api) : []), [api]);

  useEffect(() => {
    if (!api) return;
    setSelection(defaultVariantSelection(getVariantDimensions(api)));
    setQuantity(1);
    setStockxLivePrice(null);
  }, [api]);

  // ─── Adapter detection ──────────────────────────────────────────────────────

  const src = api?.source;
  const adapterGoat   = isGoat(src);
  const adapterApple  = isApple(src);
  const adapterAmazon = isAmazon(src);
  const adapterZara   = isZara(src);
  const adapterStockX = isStockX(src);
  const adapterEbay   = isEbay(src);
  const adapterNike   = isNike(src);

  // Nike product type detection
  const nikeHasFit   = adapterNike && dimensions.some((d) => d.name === "Fit");
  const nikeHasWidth = adapterNike && dimensions.some((d) => d.name === "Width");

  // ─── Variant selection ──────────────────────────────────────────────────────

  const variantSelection = useMemo(() => {
    if (!dimensions.length) return {} as Record<string, string>;
    const out: Record<string, string> = {};
    for (const d of dimensions) out[d.name] = selection[d.name] ?? d.options[0] ?? "";
    return out;
  }, [dimensions, selection]);

  // ─── Active config price (GOAT per-size / Apple Storage×Color) ──────────────

  const activeConfigPrice = useMemo((): ApiConfigurationPrice | null => {
    if (!api?.configurationPrices?.length) return null;
    if (adapterGoat) {
      const size = selection["Size"] ?? variantSelection["Size"];
      return api.configurationPrices.find((r) => r.optionValue === size) ?? null;
    }
    if (adapterApple) {
      const storage = selection["Storage"] ?? variantSelection["Storage"];
      const color   = selection["Color"]   ?? variantSelection["Color"];
      return api.configurationPrices.find(
        (r) => r.variantSelections?.["Storage"] === storage && r.variantSelections?.["Color"] === color
      ) ?? null;
    }
    return null;
  }, [api, selection, variantSelection, adapterGoat, adapterApple]);

  // ─── StockX selected size row ───────────────────────────────────────────────

  const stockxSelectedRow = useMemo((): ApiConfigurationPrice | null => {
    if (!adapterStockX || !api?.configurationPrices?.length) return null;
    const size = selection["Size"] ?? variantSelection["Size"];
    return api.configurationPrices.find((r) => r.optionValue === size) ?? null;
  }, [adapterStockX, api, selection, variantSelection]);

  const stockxPriceNeedsLookup =
    stockxSelectedRow?.metadata?.priceNeedsLookup === true && !stockxLivePrice;

  // ─── Pricing ────────────────────────────────────────────────────────────────

  const currency    = api?.currency ?? "USD";
  const images      = api?.images?.length ? api.images : ["/product-placeholder.svg"];
  const stockRaw    = api?.stockQuantity;
  const stockNum    = stockRaw == null ? null : coerceNumber(stockRaw, 0);
  const retailer    = retailerLabelFromSource(api?.source);
  const listingUrl  = api?.sourceUrl ?? api?.scrapeUrl;

  const originalNum = api ? coerceNumber(api.originalPrice, 0) : 0;
  const saleNum     = api ? coerceNumber(api.salePrice ?? api.originalPrice ?? 0, 0) : 0;

  // Adapter compareAtPrice (crossed-out list price from API)
  const adapterCompareAtNum = api?.compareAtPrice ? coerceNumber(api.compareAtPrice, 0) : 0;

  // The "current" price for comparison logic (base sale price; GOAT/Apple override below)
  const showAdapterCompare = adapterCompareAtNum > 0 && adapterCompareAtNum > saleNum;
  const showOldCompare = !showAdapterCompare && originalNum > 0 && saleNum > 0 && !pricesAreEqual(api?.originalPrice, api?.salePrice);

  const priceCompareAtStr = showAdapterCompare
    ? formatApiMoney(api?.compareAtPrice, currency)
    : showOldCompare ? formatApiMoney(api?.originalPrice, currency) : undefined;

  // Displayed price — may update with GOAT/Apple selection
  const displayedPriceStr = useMemo(() => {
    if ((adapterGoat || adapterApple) && activeConfigPrice?.originalPrice) {
      return formatApiMoney(activeConfigPrice.originalPrice, currency);
    }
    return formatApiMoney(api?.salePrice ?? api?.originalPrice, currency);
  }, [adapterGoat, adapterApple, activeConfigPrice, api, currency]);

  // Unit price for cart (follows displayed price)
  const unitPrice = useMemo(() => {
    if ((adapterGoat || adapterApple) && activeConfigPrice?.originalPrice) {
      return coerceNumber(activeConfigPrice.originalPrice, 0);
    }
    return coerceNumber(api?.salePrice ?? api?.originalPrice ?? 0, 0);
  }, [adapterGoat, adapterApple, activeConfigPrice, api]);

  // Discount badge — prefer raw text from adapter
  const discountLabel = api?.discount?.trim() || null;
  const discountPercent = discountLabel ? null
    : showAdapterCompare && adapterCompareAtNum > 0 && saleNum > 0 && saleNum < adapterCompareAtNum
      ? Math.round((1 - saleNum / adapterCompareAtNum) * 100)
    : showOldCompare && originalNum > 0 && saleNum > 0 && saleNum < originalNum
      ? Math.round((1 - saleNum / originalNum) * 100)
    : null;

  // Promotional extras
  const dealType     = api?.dealType?.trim()     || null;
  const savingsAmount = api?.savingsAmount?.trim() || null;

  // ─── Adapter-specific helpers ───────────────────────────────────────────────

  const ebayCondition = adapterEbay ? parseConditionFromDescription(api?.description) : null;
  const ebayShipping  = adapterEbay ? parseShippingFromDescription(api?.description)  : null;

  // Apple: deep-link URL for the selected Storage × Color × Carrier triple
  const appleCarrierUrl = useMemo((): string | null => {
    if (!adapterApple) return null;
    const map     = api?.metadata?.carrierLinkMap as Record<string, string> | undefined;
    const storage = selection["Storage"] ?? variantSelection["Storage"];
    const color   = selection["Color"]   ?? variantSelection["Color"];
    const carrier = selection["Carrier"] ?? variantSelection["Carrier"];
    if (!map || !storage || !color || !carrier) return null;
    return map[`${storage}|${color}|${carrier}`] ?? null;
  }, [adapterApple, api, selection, variantSelection]);

  // ─── Variant availability ───────────────────────────────────────────────────

  const variantIsAvailable = useMemo((): boolean => {
    if (!api?.configurationPrices?.length) return true;

    if (adapterGoat) {
      const size = selection["Size"] ?? variantSelection["Size"];
      if (!size) return true;
      const row = api.configurationPrices.find((r) => r.optionValue === size);
      return !!row && row.available !== false;
    }

    if (adapterZara) {
      const size = selection["Size"] ?? variantSelection["Size"];
      if (!size) return true;
      const row = api.configurationPrices.find((r) => r.optionValue === size);
      return !row || row.available !== false;
    }

    if (adapterNike && !nikeHasFit) {
      if (nikeHasWidth) {
        const width = selection["Width"] ?? variantSelection["Width"];
        const size  = selection["Size"]  ?? variantSelection["Size"];
        if (!width || !size) return true;
        const row = api.configurationPrices.find(
          (r) => r.variantSelections?.["Width"] === width && r.variantSelections?.["Size"] === size
        );
        return !row || row.available !== false;
      }
      const size = selection["Size"] ?? variantSelection["Size"];
      if (!size) return true;
      const row = api.configurationPrices.find((r) => r.variantAxis === "Size" && r.optionValue === size);
      return !row || row.available !== false;
    }

    return true;
  }, [api, selection, variantSelection, adapterGoat, adapterZara, adapterNike, nikeHasFit, nikeHasWidth]);

  const inStock = (stockNum == null || stockNum > 0) && variantIsAvailable;

  // ─── Stable IDs ─────────────────────────────────────────────────────────────

  const crumbs: ProductDetailCrumb[] = useMemo(() => {
    if (!api) return [];
    return [{ label: "Home", href: "/" }, { label: api.title }];
  }, [api]);

  const descriptionBlocks = useMemo(() => (api ? buildDescriptionBlocks(api) : []), [api]);
  const detailZones = useMemo(() => (api ? buildProductDetailZonesFromApi(api) : undefined), [api]);
  const freshLine = api ? formatFreshLine(api) : null;

  // ─── Configuration prices table (suppressed for adapters with variant-level UX) ─

  const configurationPricesSlot = useMemo(() => {
    if (adapterGoat || adapterApple || adapterStockX || adapterZara || adapterNike || adapterEbay) {
      return undefined;
    }
    const rows = api?.configurationPrices?.filter((r) => {
      if ((r.displayLabel ?? r.label)?.trim()) return true;
      if (r.variantAxis?.trim() && r.optionValue?.trim()) return true;
      return r.salePrice != null || r.originalPrice != null;
    });
    if (!rows?.length) return undefined;
    return <ConfigurationPricesTable rows={rows} currency={currency} />;
  }, [api, currency, adapterGoat, adapterApple, adapterStockX, adapterZara, adapterNike, adapterEbay]);

  // ─── StockX live price handler (stub — wire to endpoint when available) ──────

  const handleStockxLivePriceFetch = async () => {
    setStockxFetchingPrice(true);
    setFormErr("");
    try {
      // TODO: call live-price endpoint, e.g. GET /products/stockx/live-price?variantId=...
      await new Promise((r) => setTimeout(r, 1200));
      setFormErr("Live price lookup is not yet available. Check StockX directly for current resale pricing.");
    } finally {
      setStockxFetchingPrice(false);
    }
  };

  // ─── Variant slots (adapter-aware) ──────────────────────────────────────────

  const variantSlots: ProductDetailVariantSlot[] | undefined = useMemo(() => {
    if (!dimensions.length) return undefined;

    const adGOAT   = isGoat(api?.source);
    const adApple  = isApple(api?.source);
    const adStockX = isStockX(api?.source);
    const adZara   = isZara(api?.source);
    const adNike   = isNike(api?.source);
    const hasFit   = adNike && dimensions.some((d) => d.name === "Fit");
    const hasWidth = adNike && dimensions.some((d) => d.name === "Width");

    // Default pill / swatch slot
    const makeDefault = (dim: { name: string; options: string[] }): ProductDetailVariantSlot => {
      if (isColorLikeDimension(dim.name)) {
        return {
          title: dim.name,
          content: (
            <div className="flex flex-wrap gap-3">
              {dim.options.map((opt, oi) => {
                const sel = selection[dim.name] ?? dim.options[0] ?? "";
                const active = sel === opt;
                return (
                  <button key={opt} type="button" title={opt}
                    onClick={() => setSelection((prev) => ({ ...prev, [dim.name]: opt }))}
                    className={`relative h-11 w-11 rounded-full border-2 transition ${active ? "border-shop-ink ring-2 ring-shop-ink ring-offset-2" : "border-black/15 hover:border-black/35"}`}
                    style={{ backgroundColor: swatchColorForOption(opt, oi) }}
                    aria-label={`${dim.name}: ${opt}`} aria-pressed={active}
                  >
                    {active ? <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow"><Check size={18} strokeWidth={2.25} aria-hidden /></span> : null}
                  </button>
                );
              })}
            </div>
          ),
        };
      }
      return {
        title: dim.name,
        subtitle: "Choose one option.",
        content: (
          <div className="flex flex-wrap gap-2" role="group" aria-label={dim.name}>
            {dim.options.map((opt) => {
              const sel = selection[dim.name] ?? dim.options[0] ?? "";
              const active = sel === opt;
              return (
                <button key={opt} type="button"
                  onClick={() => setSelection((prev) => ({ ...prev, [dim.name]: opt }))}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"}`}
                  aria-pressed={active}
                >{opt}</button>
              );
            })}
          </div>
        ),
      };
    };

    // ── GOAT: size buttons with per-size price ──────────────────────────────
    if (adGOAT) {
      return dimensions.map((dim) => {
        if (dim.name !== "Size") return makeDefault(dim);
        return {
          title: "Size",
          content: (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Size">
              {dim.options.map((opt) => {
                const row = api?.configurationPrices?.find((r) => r.optionValue === opt);
                const hasAsk   = !!row;
                const available = row ? row.available !== false : false;
                const sel    = selection["Size"] ?? dim.options[0] ?? "";
                const active = sel === opt;
                const priceStr = row?.originalPrice ? formatApiMoney(row.originalPrice, currency) : null;
                return (
                  <button key={opt} type="button"
                    disabled={!hasAsk || !available}
                    onClick={() => setSelection((prev) => ({ ...prev, Size: opt }))}
                    title={!hasAsk ? "No active ask for this size" : !available ? "Sold out" : undefined}
                    className={[
                      "flex flex-col items-center rounded-xl border px-3 py-2 text-sm transition",
                      active ? "border-gray-900 bg-gray-900 text-white"
                        : hasAsk && available ? "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                        : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 line-through",
                    ].join(" ")}
                    aria-pressed={active}
                  >
                    <span className="font-medium">{opt}</span>
                    <span className={`text-[11px] leading-tight ${active ? "text-white/75" : !hasAsk ? "text-gray-400" : "text-gray-500"}`}>
                      {priceStr ?? "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          ),
        };
      });
    }

    // ── Apple: Storage (pill) → Color (swatch, price updates) → Carrier ────
    if (adApple) {
      return dimensions.map((dim) => {
        if (isColorLikeDimension(dim.name)) {
          return {
            title: dim.name,
            content: (
              <div className="flex flex-wrap gap-3">
                {dim.options.map((opt, oi) => {
                  const sel    = selection[dim.name] ?? dim.options[0] ?? "";
                  const active = sel === opt;
                  return (
                    <button key={opt} type="button" title={opt}
                      onClick={() => setSelection((prev) => ({ ...prev, [dim.name]: opt }))}
                      className={`relative h-11 w-11 rounded-full border-2 transition ${active ? "border-shop-ink ring-2 ring-shop-ink ring-offset-2" : "border-black/15 hover:border-black/35"}`}
                      style={{ backgroundColor: swatchColorForOption(opt, oi) }}
                      aria-label={`${dim.name}: ${opt}`} aria-pressed={active}
                    >
                      {active ? <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow"><Check size={18} strokeWidth={2.25} aria-hidden /></span> : null}
                    </button>
                  );
                })}
              </div>
            ),
          };
        }

        if (dim.name === "Carrier") {
          const storage = selection["Storage"] ?? variantSelection["Storage"];
          const color   = selection["Color"]   ?? variantSelection["Color"];
          const map = api?.metadata?.carrierLinkMap as Record<string, string> | undefined;
          return {
            title: "Carrier",
            subtitle: "Does not affect price — routes to the carrier's checkout.",
            content: (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Carrier">
                {dim.options.map((opt) => {
                  const hasUrl = !map || !!map[`${storage}|${color}|${opt}`];
                  const sel    = selection["Carrier"] ?? dim.options[0] ?? "";
                  const active = sel === opt;
                  return (
                    <button key={opt} type="button"
                      disabled={!hasUrl}
                      onClick={() => setSelection((prev) => ({ ...prev, Carrier: opt }))}
                      title={!hasUrl ? "Not available for this colour and storage" : undefined}
                      className={[
                        "rounded-xl border px-4 py-1.5 text-sm font-medium transition",
                        active ? "border-gray-900 bg-gray-900 text-white"
                          : hasUrl ? "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                          : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300",
                      ].join(" ")}
                      aria-pressed={active}
                    >{opt}</button>
                  );
                })}
              </div>
            ),
          };
        }

        // Storage or other non-color, non-carrier dims
        return {
          title: dim.name,
          content: (
            <div className="flex flex-wrap gap-2" role="group" aria-label={dim.name}>
              {dim.options.map((opt) => {
                const sel    = selection[dim.name] ?? dim.options[0] ?? "";
                const active = sel === opt;
                return (
                  <button key={opt} type="button"
                    onClick={() => setSelection((prev) => ({ ...prev, [dim.name]: opt }))}
                    className={`rounded-xl border px-4 py-1.5 text-sm font-medium transition ${active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"}`}
                    aria-pressed={active}
                  >{opt}</button>
                );
              })}
            </div>
          ),
        };
      });
    }

    // ── StockX: size buttons with US + EU labels ────────────────────────────
    if (adStockX) {
      return dimensions.map((dim) => {
        if (dim.name !== "Size") return makeDefault(dim);
        return {
          title: "Size",
          content: (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Size">
              {dim.options.map((opt) => {
                const row   = api?.configurationPrices?.find((r) => r.optionValue === opt);
                const euSize = row?.metadata?.sizeEU as string | undefined;
                const sel   = selection["Size"] ?? dim.options[0] ?? "";
                const active = sel === opt;
                return (
                  <button key={opt} type="button"
                    onClick={() => {
                      setSelection((prev) => ({ ...prev, Size: opt }));
                      setStockxLivePrice(null);
                    }}
                    className={[
                      "flex flex-col items-center rounded-xl border px-3 py-2 text-sm transition",
                      active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400",
                    ].join(" ")}
                    aria-pressed={active}
                  >
                    <span className="font-medium">{opt}</span>
                    {euSize ? <span className={`text-[11px] leading-tight ${active ? "text-white/75" : "text-gray-500"}`}>{euSize}</span> : null}
                  </button>
                );
              })}
            </div>
          ),
        };
      });
    }

    // ── Zara: size buttons with OOS, colour as display-only ────────────────
    if (adZara) {
      return dimensions.map((dim) => {
        if (dim.name === "Size") {
          return {
            title: "Size",
            content: (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Size">
                {dim.options.map((opt) => {
                  const row      = api?.configurationPrices?.find((r) => r.optionValue === opt);
                  const available = row ? row.available !== false : true;
                  const sel      = selection["Size"] ?? dim.options[0] ?? "";
                  const active   = sel === opt;
                  return (
                    <button key={opt} type="button"
                      disabled={!available}
                      onClick={() => available && setSelection((prev) => ({ ...prev, Size: opt }))}
                      title={!available ? "Out of stock" : undefined}
                      className={[
                        "rounded-xl border px-4 py-1.5 text-sm font-medium transition",
                        active ? "border-gray-900 bg-gray-900 text-white"
                          : available ? "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                          : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300 line-through",
                      ].join(" ")}
                      aria-pressed={active}
                    >{opt}</button>
                  );
                })}
              </div>
            ),
          };
        }
        if (isColorLikeDimension(dim.name) && dim.options.length > 1) {
          return {
            title: dim.name,
            subtitle: "Other colours are separate product pages on Zara.",
            content: (
              <div className="flex flex-wrap gap-3">
                {dim.options.map((opt, oi) => {
                  const sel    = selection[dim.name] ?? dim.options[0] ?? "";
                  const active = sel === opt;
                  return (
                    <button key={opt} type="button" title={opt}
                      onClick={() => setSelection((prev) => ({ ...prev, [dim.name]: opt }))}
                      className={`relative h-11 w-11 rounded-full border-2 transition ${active ? "border-shop-ink ring-2 ring-shop-ink ring-offset-2" : "border-black/15 hover:border-black/35"}`}
                      style={{ backgroundColor: swatchColorForOption(opt, oi) }}
                      aria-label={`${dim.name}: ${opt}`} aria-pressed={active}
                    >
                      {active ? <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow"><Check size={18} strokeWidth={2.25} aria-hidden /></span> : null}
                    </button>
                  );
                })}
              </div>
            ),
          };
        }
        return makeDefault(dim);
      });
    }

    // ── Nike: Fit (segmented control), Width, Size ──────────────────────────
    if (adNike) {
      return dimensions.map((dim) => {
        // Type A — Fit group selector with prices; non-current group = navigation
        if (dim.name === "Fit") {
          return {
            title: "Fit",
            content: (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Fit">
                {dim.options.map((opt) => {
                  const row = api?.configurationPrices?.find(
                    (r) => r.variantAxis === "Fit" && r.optionValue === opt
                  );
                  const isCurrentGroup = row?.metadata?.isSelectedGroup === true;
                  const pdpUrl  = row?.metadata?.pdpUrl as string | undefined;
                  const priceStr = row?.originalPrice ? formatApiMoney(row.originalPrice, currency) : null;
                  return (
                    <button key={opt} type="button"
                      onClick={() => {
                        if (!isCurrentGroup && pdpUrl) {
                          window.open(pdpUrl, "_blank", "noopener,noreferrer");
                        }
                      }}
                      title={!isCurrentGroup && pdpUrl ? "Opens on Nike (separate product)" : undefined}
                      className={[
                        "flex flex-col items-center rounded-xl border px-4 py-2 text-sm transition",
                        isCurrentGroup ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400",
                      ].join(" ")}
                      aria-pressed={isCurrentGroup}
                    >
                      <span className="font-medium">{opt}</span>
                      {priceStr ? <span className={`text-[11px] leading-tight ${isCurrentGroup ? "text-white/75" : "text-gray-500"}`}>{priceStr}</span> : null}
                    </button>
                  );
                })}
              </div>
            ),
          };
        }

        // Type B — Width selector
        if (dim.name === "Width") {
          return {
            title: "Width",
            content: (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Width">
                {dim.options.map((opt) => {
                  const sel    = selection["Width"] ?? dim.options[0] ?? "";
                  const active = sel === opt;
                  return (
                    <button key={opt} type="button"
                      onClick={() => setSelection((prev) => ({ ...prev, Width: opt }))}
                      className={`rounded-xl border px-4 py-1.5 text-sm font-medium transition ${active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-400"}`}
                      aria-pressed={active}
                    >{opt}</button>
                  );
                })}
              </div>
            ),
          };
        }

        // Size axis (Type B: Width×Size cross-product, Type C: single-group)
        if (dim.name === "Size") {
          return {
            title: "Size",
            content: (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Size">
                {dim.options.map((opt) => {
                  let row: ApiConfigurationPrice | undefined;
                  if (hasWidth) {
                    const width = selection["Width"] ?? variantSelection["Width"];
                    row = api?.configurationPrices?.find(
                      (r) => r.variantSelections?.["Width"] === width && r.variantSelections?.["Size"] === opt
                    );
                  } else {
                    row = api?.configurationPrices?.find(
                      (r) => r.variantAxis === "Size" && r.optionValue === opt
                    );
                  }
                  const available = row ? row.available !== false : true;
                  const sel    = selection["Size"] ?? dim.options[0] ?? "";
                  const active = sel === opt;
                  return (
                    <button key={opt} type="button"
                      disabled={!available}
                      onClick={() => setSelection((prev) => ({ ...prev, Size: opt }))}
                      title={!available ? "Not available" : undefined}
                      className={[
                        "rounded-xl border px-4 py-1.5 text-sm font-medium transition",
                        active ? "border-gray-900 bg-gray-900 text-white"
                          : available ? "border-gray-200 bg-white text-gray-700 hover:border-gray-400"
                          : "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300",
                      ].join(" ")}
                      aria-pressed={active}
                    >{opt}</button>
                  );
                })}
              </div>
            ),
          };
        }

        return makeDefault(dim);
      });
    }

    // ── Default (generic / Amazon / eBay) ───────────────────────────────────
    return dimensions.map(makeDefault);
  }, [dimensions, selection, api, currency, variantSelection]);

  // ─── Availability slot (stock + deal badges + condition) ─────────────────────

  const availabilitySlot = useMemo((): ReactNode => {
    const parts: ReactNode[] = [];

    if (dealType) {
      parts.push(
        <span key="deal" className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          {dealType}
        </span>
      );
    }

    if (ebayCondition) {
      parts.push(
        <span key="condition" className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700">
          {ebayCondition}
        </span>
      );
    }

    if (stockNum != null) {
      if (stockNum <= 0) {
        parts.push(<span key="stock" className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">Out of stock</span>);
      } else if (stockNum < 5) {
        parts.push(<span key="stock" className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-500">Only {stockNum} left</span>);
      } else if (stockNum < 20) {
        parts.push(<span key="stock" className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">Low stock — {stockNum} remaining</span>);
      }
    }

    if (adapterZara && api?.configurationPrices?.length && api.configurationPrices.every((r) => r.available === false)) {
      parts.push(<span key="zara-oos" className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">Out of stock</span>);
    }

    return parts.length ? <div className="flex flex-wrap gap-2">{parts}</div> : null;
  }, [dealType, ebayCondition, stockNum, adapterZara, api]);

  // ─── Price meta (below price row) ────────────────────────────────────────────

  const priceMeta = useMemo((): ReactNode => {
    const parts: ReactNode[] = [];

    if (savingsAmount) {
      const savingsNum = parseFloat(savingsAmount);
      const formatted = Number.isFinite(savingsNum)
        ? savingsNum.toLocaleString("en-US", { minimumFractionDigits: 2 })
        : savingsAmount;
      parts.push(
        <p key="savings" className="text-sm font-medium text-emerald-700">
          You save: {currency} {formatted}
        </p>
      );
    }

    if (ebayShipping) {
      parts.push(
        <p key="shipping" className="text-sm text-shop-muted">Shipping: {ebayShipping}</p>
      );
    }

    if (adapterStockX) {
      const priceSource = api?.metadata?.priceSource as string | undefined;
      if (priceSource === "retail-reference") {
        parts.push(
          <p key="priceref" className="text-xs text-amber-700">
            Retail reference price only. Live resale prices may be 30–200%+ higher.
          </p>
        );
      } else if (priceSource === "lowest-ask") {
        parts.push(
          <p key="priceref" className="text-xs text-shop-muted">
            Aggregate lowest ask across all sizes — per-size price confirmed at checkout.
          </p>
        );
      }
    }

    return parts.length ? <div className="mt-1 space-y-1">{parts}</div> : null;
  }, [savingsAmount, currency, ebayShipping, adapterStockX, api]);

  // ─── Meta lines ──────────────────────────────────────────────────────────────

  const metaLines: { label: string; value: ReactNode }[] = [];
  if (api?.availability?.trim()) {
    metaLines.push({ label: "Seller note", value: api.availability });
  } else if (listingUrl) {
    metaLines.push({
      label: "Retailer",
      value: <span>See <a href={listingUrl} className="font-medium text-shop-accent underline" target="_blank" rel="noopener noreferrer">{retailer}</a> for live availability</span>,
    });
  }

  // ─── Add to cart handler ─────────────────────────────────────────────────────

  const onAdd = async () => {
    setFormErr("");
    if (!api) return;
    const qty = Math.max(1, quantity);
    if (token) {
      try {
        await addCartItem({ productId: api.id, quantity: qty, ...(Object.keys(variantSelection).length ? { variantSelection } : {}) }).unwrap();
      } catch (e) { setFormErr(getErrorMessage(e)); }
      return;
    }
    const marketplace = marketplaceFromApiSource(api.source, api.brand);
    const variantsForProduct: ProductVariant[] = Object.entries(variantSelection).map(([name, value], i) => ({ id: `v-${i}`, name, value }));
    const lineItemProduct: Product = {
      id: api.id, slug: api.slug ?? undefined, title: api.title, description: api.description ?? "",
      price: unitPrice, currency, marketplace, category: api.brand?.trim() ?? retailer ?? "Catalog",
      collection: "Store", images: api.images?.length ? api.images : ["/product-placeholder.svg"],
      variants: variantsForProduct, stock: stockNum ?? UNLIMITED_LOCAL_STOCK,
      deliveryEstimate: "Set at checkout", seller: api.brand?.trim() ?? retailer,
    };
    const selKey = Object.entries(variantSelection).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join("|");
    addItem(lineItemProduct, qty, { id: selKey || "default", name: "Selection", value: Object.entries(variantSelection).map(([k, v]) => `${k}: ${v}`).join(", ") });
  };

  // ─── Loading / error states ──────────────────────────────────────────────────

  if (isLoading) return <InnerShell><LoadingState label="Loading product…" /></InnerShell>;
  if (isError || !api) return (
    <InnerShell>
      <ErrorState error={error} title="Product unavailable" />
      <Link href="/shop" className="btn-secondary mt-4 inline-block">Browse shop</Link>
    </InnerShell>
  );

  // ─── Actions slot ────────────────────────────────────────────────────────────

  const actionsSlot = (
    <>
      {formErr ? <p className="w-full text-sm text-red-600">{formErr}</p> : null}

      {/* StockX: live-price gate blocks checkout until price is confirmed */}
      {adapterStockX && stockxSelectedRow && stockxPriceNeedsLookup ? (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {stockxSelectedRow.label ?? (selection["Size"] ?? "")}
              {stockxSelectedRow.metadata?.sizeEU ? ` · ${stockxSelectedRow.metadata.sizeEU}` : ""}
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Retail ref: {displayedPriceStr} — live resale price required before checkout.
            </p>
          </div>
          <button type="button" onClick={handleStockxLivePriceFetch}
            disabled={stockxFetchingPrice}
            className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50">
            {stockxFetchingPrice
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Fetching live price…</>
              : "Get live price"}
          </button>
        </div>
      ) : (
        <>
          <button type="button" disabled={!inStock || adding} onClick={onAdd}
            className="w-full rounded-full py-3.5 text-center text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "#5C4AE6" }}>
            {adding ? "Adding…" : "Add to cart"}
          </button>

          {/* Apple: deep-link to carrier checkout when carrier + storage + colour are selected */}
          {adapterApple && appleCarrierUrl ? (
            <a href={appleCarrierUrl} target="_blank" rel="noopener noreferrer"
              className="block w-full rounded-full bg-gray-900 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-gray-800">
              Buy on Apple
            </a>
          ) : (
            <OpenCartTrigger className="block w-full rounded-full bg-gray-900 py-3.5 text-center text-sm font-semibold text-white transition hover:bg-gray-800">
              Buy now
            </OpenCartTrigger>
          )}

          <div className="flex gap-3">
            <button type="button" className="flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
              <Heart className="h-4 w-4" /> Save
            </button>
            {listingUrl ? (
              <a href={listingUrl}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                target="_blank" rel="noopener noreferrer">
                <Share2 className="h-4 w-4" /> View on {retailer}
              </a>
            ) : (
              <button type="button" className="flex flex-1 items-center justify-center gap-2 rounded-full border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                <Share2 className="h-4 w-4" /> Share
              </button>
            )}
          </div>
          {!token ? <p className="w-full text-center text-xs text-gray-400">Sign in to sync this item with your account cart.</p> : null}
        </>
      )}
    </>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <InnerShell>
        <ProductDetailLayout
          crumbs={crumbs}
          eyebrow={api.brand?.trim() ?? retailer}
          headline={api.title}
          images={images}
          imageAlt={api.title}
          priceCurrent={displayedPriceStr}
          priceCompareAt={priceCompareAtStr}
          discountPercent={discountPercent}
          discountLabel={discountLabel}
          priceMeta={priceMeta}
          rating={stableRating(api.id)}
          ratingCount={stableRatingCount(api.id)}
          availabilitySlot={availabilitySlot}
          variantSlots={variantSlots}
          configurationPricesSlot={configurationPricesSlot}
          quantitySlot={
            <ProductQuantityStepper value={quantity} onChange={(n) => setQuantity(n)} min={1}
              max={stockNum != null ? Math.max(1, stockNum) : undefined} disabled={!inStock} />
          }
          actionsSlot={actionsSlot}
          metaLines={metaLines}
          detailZones={detailZones}
          descriptionBlocks={descriptionBlocks.length ? descriptionBlocks : undefined}
          promoBand={{
            title: api.brand?.trim() ?? retailer,
            subtitle: `Curated picks from ${retailer}. Prices and availability are confirmed at checkout.`,
          }}
          footerSlot={
            <div className="max-w-3xl space-y-2 text-xs leading-relaxed text-shop-muted">
              {freshLine ? <p>{freshLine}.</p> : null}
              <p>Retailer prices and offers can change. We refresh listings regularly; what you pay is confirmed at checkout.</p>
            </div>
          }
        />
      </InnerShell>
      <RelatedProducts idOrSlug={idOrSlug} />
    </>
  );
}

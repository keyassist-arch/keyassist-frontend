"use client";

import Link from "next/link";
import { Check } from "lucide-react";
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
import { formatApiMoney, pricesAreEqual } from "@/lib/format-price";
import { marketplaceFromApiSource, retailerLabelFromSource } from "@/lib/product-source";
import type { Product, ProductVariant } from "@/types";
import type { ApiConfigurationPrice, ApiProduct } from "@/types/api";
import type { ProductDetailCrumb, ProductDetailDescriptionBlock } from "@/types/product-detail";

const UNLIMITED_LOCAL_STOCK = 999_999;

export default function ProductPage() {
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
          <p className="mt-2 text-sm text-black/70">We couldn’t find that product. Start from the shop and open a listing from the grid.</p>
          <Link href="/shop" className="btn-secondary mt-4 inline-block">
            Browse shop
          </Link>
        </section>
      </InnerShell>
    );
  }

  return <ApiProductDetail idOrSlug={segment} />;
}

const SWATCH_BG = ["#9ca3af", "#d6c4a8", "#374151", "#e8e4df", "#78716c", "#b45309", "#0d9488"];

function swatchColorForOption(opt: string, index: number) {
  let h = 0;
  for (let i = 0; i < opt.length; i++) h = (h + opt.charCodeAt(i) * (i + 1)) % 997;
  return SWATCH_BG[(h + index) % SWATCH_BG.length];
}

function isColorLikeDimension(name: string) {
  return /color|colour|finish/i.test(name.trim());
}

function heroExcerptFromApi(api: ApiProduct): ReactNode | undefined {
  const { summary } = splitProductDescription(api.description);
  const first = summary
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)[0];
  if (!first) return undefined;
  const line = first.replace(/\s+/g, " ").trim();
  const cut = line.length > 280 ? `${line.slice(0, 277)}…` : line;
  return <p>{cut}</p>;
}

function stableViewingCount(productId: string) {
  const hex = productId.replace(/-/g, "").slice(0, 10);
  const n = parseInt(hex, 16);
  const base = Number.isFinite(n) ? n % 38 : 0;
  return 18 + base;
}

function configurationRowLabel(row: ApiConfigurationPrice): string {
  const primary = row.displayLabel?.trim() || row.label?.trim();
  if (primary) return primary;
  if (row.variantAxis?.trim() && row.optionValue?.trim()) {
    return `${row.variantAxis}: ${row.optionValue}`;
  }
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
          {showSkuCol ? (
            <th className="py-2 pr-3 font-medium">Part / SKU</th>
          ) : null}
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
          const title = configurationRowLabel(row);
          return (
            <tr key={i} className="border-b border-black/5 last:border-b-0">
              <td className="py-2.5 pr-3 align-top text-shop-ink">{title}</td>
              {showSkuCol ? (
                <td className="py-2.5 pr-3 align-top tabular-nums text-black/70">{sku ?? "—"}</td>
              ) : null}
              <td className="py-2.5 align-top tabular-nums">
                {showStrike ? (
                  <span className="mr-2 text-black/40 line-through">{formatApiMoney(row.originalPrice, rowCurrency)}</span>
                ) : null}
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

function buildDescriptionBlocks(api: ApiProduct): ProductDetailDescriptionBlock[] {
  const { summary, blocks } = splitProductDescription(api.description);
  const out: ProductDetailDescriptionBlock[] = [];
  if (summary) {
    const paras = summary.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    out.push({
      content: (
        <div className="space-y-3">
          {paras.map((p, i) => (
            <p key={i} className="whitespace-pre-wrap text-shop-ink">
              {p}
            </p>
          ))}
        </div>
      ),
    });
  }
  for (const b of blocks) {
    out.push({
      title: b.title,
      content: <pre className="whitespace-pre-wrap font-sans text-shop-ink">{b.body}</pre>,
    });
  }
  return out;
}

function formatFreshLine(api: ApiProduct): string | null {
  const scraped = api.lastScrapedAt?.trim();
  const verified = api.lastVerifiedAt?.trim();
  try {
    if (verified) {
      return `Last verified ${new Date(verified).toLocaleString()}`;
    }
    if (scraped) {
      return `Last updated ${new Date(scraped).toLocaleString()}`;
    }
  } catch {
    return null;
  }
  return null;
}

function ApiProductDetail({ idOrSlug }: { idOrSlug: string }) {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { addItem } = useCart();
  const { data: api, isLoading, isError, error } = useGetProductQuery(idOrSlug);
  const [addCartItem, { isLoading: adding }] = useAddCartItemMutation();
  const [quantity, setQuantity] = useState(1);
  const [selection, setSelection] = useState<Record<string, string>>({});
  const [formErr, setFormErr] = useState("");

  const dimensions = useMemo(() => (api ? getVariantDimensions(api) : []), [api]);

  useEffect(() => {
    if (!api) return;
    setSelection(defaultVariantSelection(getVariantDimensions(api)));
    setQuantity(1);
  }, [api]);

  const variantSelection = useMemo(() => {
    if (!dimensions.length) return {} as Record<string, string>;
    const out: Record<string, string> = {};
    for (const d of dimensions) {
      out[d.name] = selection[d.name] ?? d.options[0] ?? "";
    }
    return out;
  }, [dimensions, selection]);

  const unitPrice = api ? coerceNumber(api.salePrice ?? api.originalPrice ?? 0, 0) : 0;
  const original = api ? coerceNumber(api.originalPrice, 0) : 0;
  const sale = api ? coerceNumber(api.salePrice ?? api.originalPrice ?? 0, 0) : 0;
  const currency = api?.currency ?? "USD";
  const images = api?.images?.length ? api.images : ["/file.svg"];
  const stockRaw = api?.stockQuantity;
  const stockNum = stockRaw == null ? null : coerceNumber(stockRaw, 0);
  const inStock = stockNum == null || stockNum > 0;

  const showCompare =
    api != null &&
    original > 0 &&
    sale > 0 &&
    !pricesAreEqual(api.originalPrice, api.salePrice);

  const retailer = retailerLabelFromSource(api?.source);
  const listingUrl = api?.sourceUrl ?? api?.scrapeUrl;

  const crumbs: ProductDetailCrumb[] = useMemo(() => {
    if (!api) return [];
    return [
      { label: "Home", href: "/" },
      { label: api.title },
    ];
  }, [api]);

  const descriptionBlocks = useMemo(() => (api ? buildDescriptionBlocks(api) : []), [api]);
  const detailZones = useMemo(() => (api ? buildProductDetailZonesFromApi(api) : undefined), [api]);
  const freshLine = api ? formatFreshLine(api) : null;

  const configurationPricesSlot = useMemo(() => {
    const rows = api?.configurationPrices?.filter((r) => {
      if ((r.displayLabel ?? r.label)?.trim()) return true;
      if (r.variantAxis?.trim() && r.optionValue?.trim()) return true;
      return r.salePrice != null || r.originalPrice != null;
    });
    if (!rows?.length) return undefined;
    return <ConfigurationPricesTable rows={rows} currency={currency} />;
  }, [api, currency]);

  const onAdd = async () => {
    setFormErr("");
    if (!api) return;
    const qty = Math.max(1, quantity);
    if (token) {
      try {
        await addCartItem({
          productId: api.id,
          quantity: qty,
          ...(Object.keys(variantSelection).length ? { variantSelection } : {}),
        }).unwrap();
      } catch (e) {
        setFormErr(getErrorMessage(e));
      }
      return;
    }
    const marketplace = marketplaceFromApiSource(api.source, api.brand);
    const variantsForProduct: ProductVariant[] = Object.entries(variantSelection).map(([name, value], i) => ({
      id: `v-${i}`,
      name,
      value,
    }));
    const lineItemProduct: Product = {
      id: api.id,
      slug: api.slug ?? undefined,
      title: api.title,
      description: api.description ?? "",
      price: unitPrice,
      currency,
      marketplace,
      category: api.brand?.trim() ?? retailer ?? "Catalog",
      collection: "Store",
      images: api.images?.length ? api.images : ["/file.svg"],
      variants: variantsForProduct,
      stock: stockNum ?? UNLIMITED_LOCAL_STOCK,
      deliveryEstimate: "Set at checkout",
      seller: api.brand?.trim() ?? retailer,
    };
    const selKey = Object.entries(variantSelection)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join("|");
    const cartVariant: ProductVariant = {
      id: selKey || "default",
      name: "Selection",
      value: Object.entries(variantSelection)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", "),
    };
    addItem(lineItemProduct, qty, cartVariant);
  };

  if (isLoading) {
    return (
      <InnerShell>
        <LoadingState label="Loading product…" />
      </InnerShell>
    );
  }

  if (isError || !api) {
    return (
      <InnerShell>
        <ErrorState error={error} title="Product unavailable" />
        <Link href="/shop" className="btn-secondary mt-4 inline-block">
          Browse shop
        </Link>
      </InnerShell>
    );
  }

  const discountPercent =
    showCompare && original > 0 && sale > 0 && sale < original
      ? Math.round((1 - sale / original) * 100)
      : null;

  const metaLines: { label: string; value: ReactNode }[] = [];

  if (api.availability?.trim()) {
    metaLines.push({ label: "Seller note", value: api.availability });
  } else if (listingUrl) {
    metaLines.push({
      label: "Retailer",
      value: (
        <span>
          See{" "}
          <a href={listingUrl} className="font-medium text-shop-accent underline" target="_blank" rel="noopener noreferrer">
            {retailer}
          </a>{" "}
          for live availability
        </span>
      ),
    });
  }

  const availabilitySlot =
    stockNum == null ? (
      <span className="inline-flex items-center gap-2 text-shop-ink">
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
        Available to order
      </span>
    ) : stockNum <= 0 ? (
      <span className="inline-flex items-center gap-2 text-shop-sale">
        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden />
        Out of stock
      </span>
    ) : stockNum < 100 ? (
      <span className="inline-flex items-center gap-2 text-shop-ink">
        <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" aria-hidden />
        Low stock: {stockNum} left
      </span>
    ) : (
      <span className="inline-flex items-center gap-2 text-shop-ink">
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
        In stock
      </span>
    );

  const variantSlots =
    dimensions.length > 0
      ? dimensions.map((dim) => ({
          title: dim.name,
          subtitle: isColorLikeDimension(dim.name) ? undefined : "Choose one option.",
          content: isColorLikeDimension(dim.name) ? (
            <div className="flex flex-wrap gap-3">
              {dim.options.map((opt, oi) => {
                const sel = selection[dim.name] ?? dim.options[0] ?? "";
                const active = sel === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    title={opt}
                    onClick={() => setSelection((prev) => ({ ...prev, [dim.name]: opt }))}
                    className={`relative h-11 w-11 rounded-full border-2 transition ${
                      active ? "border-shop-ink ring-2 ring-shop-ink ring-offset-2" : "border-black/15 hover:border-black/35"
                    }`}
                    style={{ backgroundColor: swatchColorForOption(opt, oi) }}
                    aria-label={`${dim.name}: ${opt}`}
                    aria-pressed={active}
                  >
                    {active ? (
                      <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow">
                        <Check size={18} strokeWidth={2.25} aria-hidden />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <label className="block max-w-md">
              <span className="sr-only">{dim.name}</span>
              <select
                className="input mt-0 block w-full"
                value={selection[dim.name] ?? dim.options[0] ?? ""}
                onChange={(e) => setSelection((prev) => ({ ...prev, [dim.name]: e.target.value }))}
                aria-label={dim.name}
              >
                {dim.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          ),
        }))
      : undefined;

  return (
    <InnerShell>
      <ProductDetailLayout
        crumbs={crumbs}
        headline={api.title}
        images={images}
        imageAlt={api.title}
        priceCurrent={formatApiMoney(api.salePrice ?? api.originalPrice, currency)}
        priceCompareAt={showCompare ? formatApiMoney(api.originalPrice, currency) : undefined}
        discountPercent={discountPercent}
        heroExcerpt={heroExcerptFromApi(api)}
        showDealCountdown={Boolean(showCompare)}
        viewingCount={stableViewingCount(api.id)}
        availabilitySlot={availabilitySlot}
        variantSlots={variantSlots}
        configurationPricesSlot={configurationPricesSlot}
        quantitySlot={
          <ProductQuantityStepper
            value={quantity}
            onChange={(n) => setQuantity(n)}
            min={1}
            max={stockNum != null ? Math.max(1, stockNum) : undefined}
            disabled={!inStock}
          />
        }
        actionsSlot={
          <>
            {formErr ? <p className="w-full text-sm text-red-600">{formErr}</p> : null}
            {!token ? (
              <p className="w-full text-xs text-shop-muted">Sign in to sync this item with your account cart.</p>
            ) : null}
            <button
              type="button"
              disabled={!inStock || adding}
              onClick={onAdd}
              className="w-full rounded-none bg-black py-3.5 text-center text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? "Adding…" : "Add to cart"}
            </button>
            <div className="flex flex-wrap gap-2">
              {listingUrl ? (
                <a
                  href={listingUrl}
                  className="btn-secondary inline-flex min-w-40 flex-1 items-center justify-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on {retailer}
                </a>
              ) : null}
              <OpenCartTrigger className="btn-secondary inline-flex min-w-40 flex-1 items-center justify-center">
                View bag
              </OpenCartTrigger>
            </div>
          </>
        }
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
  );
}

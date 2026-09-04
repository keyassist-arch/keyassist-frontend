"use client";

import Link from "next/link";
import { Share2 } from "lucide-react";
import toast from "react-hot-toast";
import type { ProductDetailLayoutProps } from "@/types/product-detail";
import { ProductDetailGallery } from "@/components/product/product-detail-gallery";
import { ProductDetailTabs } from "@/components/product/product-detail-tabs";
import { ProductDetailZonesBelowStory } from "@/components/product/product-detail-zones";
import { ProductRatingStars } from "@/components/product/product-rating-stars";

async function shareProduct(title: string) {
  const url = typeof window !== "undefined" ? window.location.href : "";
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch {
      return;
    }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  }
}

export function ProductDetailLayout({
  crumbs,
  eyebrow,
  headline,
  images,
  imageAlt,
  priceCurrent,
  priceCompareAt,
  discountPercent,
  discountLabel,
  priceMeta,
  rating,
  ratingCount,
  availabilitySlot,
  variantSlots,
  configurationPricesSlot,
  quantitySlot,
  actionsSlot,
  metaLines,
  detailZones,
  descriptionBlocks,
  promoBand,
  footerSlot,
}: ProductDetailLayoutProps) {
  const pct =
    !discountLabel && discountPercent != null && discountPercent > 0
      ? Math.min(99, Math.round(discountPercent))
      : null;
  const badgeText = discountLabel ?? (pct != null ? `-${pct}%` : null);

  return (
    <div className="pb-16">
      <nav className="mb-7 text-xs text-shop-muted" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {crumbs.map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              {i > 0 ? <span aria-hidden style={{ color: "#C7C2BB" }}>/</span> : null}
              {c.href ? (
                <Link href={c.href} className="hover:text-shop-ink hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span className="max-w-[min(100%,520px)] truncate font-semibold text-shop-ink">{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 xl:gap-[56px]">
        <ProductDetailGallery images={images} alt={imageAlt} storeLabel={eyebrow} discountLabel={badgeText} />

        {/* Right panel */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-col gap-5">
            {/* Seller / brand row */}
            {eyebrow && (
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold tracking-wide text-shop-muted uppercase">{eyebrow}</p>
                <button
                  type="button"
                  onClick={() => void shareProduct(headline)}
                  className="flex items-center gap-1.5 rounded-full border border-shop-border bg-white px-3 py-[7px] text-xs font-medium text-shop-muted transition hover:text-shop-ink"
                >
                  <Share2 className="h-3.5 w-3.5" aria-hidden />
                  Share
                </button>
              </div>
            )}

            {/* Title */}
            <h1 className="text-[26px] font-extrabold leading-[1.2] tracking-[-0.6px] text-shop-ink sm:text-[30px]">
              {headline}
            </h1>

            {/* Stars + count */}
            <div className="flex items-center gap-2">
              <ProductRatingStars rating={rating} />
              {ratingCount != null && ratingCount > 0 && (
                <span className="text-sm text-shop-muted">{ratingCount.toLocaleString()} ratings</span>
              )}
            </div>

            {/* Availability pill */}
            {availabilitySlot ? (
              <div>{availabilitySlot}</div>
            ) : null}

            {/* Price */}
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
              {priceCompareAt ? (
                <span className="text-lg tabular-nums line-through" style={{ color: "#B7B2AB" }}>{priceCompareAt}</span>
              ) : null}
              <span className="text-[34px] font-extrabold tracking-[-1px] tabular-nums text-shop-ink sm:text-[40px]">{priceCurrent}</span>
              {badgeText ? (
                <span
                  className="rounded-full px-2.5 py-[5px] text-[13px] font-bold"
                  style={{ background: "#FEECEC", color: "var(--shop-sale)" }}
                >
                  {discountLabel ?? `Save ${pct}%`}
                </span>
              ) : null}
            </div>
            {priceMeta ? <div>{priceMeta}</div> : null}
            <p className="text-[13px] text-shop-muted">All-in price — item, US procurement &amp; freight included.</p>

            <div className="h-px w-full bg-shop-border" />

            {/* Variant pickers */}
            {variantSlots?.map((slot, i) => (
              <section key={i}>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-shop-ink">{slot.title}</h2>
                  {slot.subtitle ? <p className="text-xs text-shop-muted">{slot.subtitle}</p> : null}
                </div>
                {slot.content}
              </section>
            ))}

            {/* Configuration prices table */}
            {configurationPricesSlot ? (
              <section className="border-t border-shop-border pt-4">
                <h2 className="mb-1 text-sm font-bold text-shop-ink">Configuration prices</h2>
                <p className="mb-3 text-xs text-shop-muted">Prices from the retailer for each build or SKU.</p>
                <div className="overflow-x-auto">{configurationPricesSlot}</div>
              </section>
            ) : null}

            {/* Quantity */}
            {quantitySlot ? (
              <section className="flex items-center gap-4">
                <h2 className="text-sm font-bold text-shop-ink">Quantity</h2>
                {quantitySlot}
              </section>
            ) : null}

            {/* Primary actions */}
            <div className="flex flex-col gap-3 pt-1">{actionsSlot}</div>

            {/* Meta lines (retailer info, etc.) */}
            {metaLines?.length ? (
              <ul className="space-y-2 border-t border-shop-border pt-4 text-sm">
                {metaLines.map((row, i) => (
                  <li key={i} className="text-shop-muted">
                    <span className="text-shop-ink">{row.label}</span>{" "}
                    <span>{row.value}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      <ProductDetailTabs
        descriptionBlocks={descriptionBlocks}
        detailZones={detailZones}
      />

      <ProductDetailZonesBelowStory zones={detailZones} />

      {promoBand ? (
        <div className="mt-14 rounded-2xl bg-white px-6 py-10 text-center sm:px-10 sm:py-12" style={{ border: "1px solid var(--shop-border)" }}>
          <p className="text-xl font-bold tracking-tight text-shop-ink sm:text-2xl">{promoBand.title}</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-shop-muted sm:text-base">{promoBand.subtitle}</p>
        </div>
      ) : null}

      {footerSlot ? <div className="mt-12">{footerSlot}</div> : null}
    </div>
  );
}

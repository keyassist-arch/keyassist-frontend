import Link from "next/link";
import { MoreHorizontal, Heart, Share2 } from "lucide-react";
import type { ProductDetailLayoutProps } from "@/types/product-detail";
import { ProductDetailGallery } from "@/components/product/product-detail-gallery";
import { ProductDetailTabs } from "@/components/product/product-detail-tabs";
import { ProductDetailZonesBelowStory } from "@/components/product/product-detail-zones";
import { ProductRatingStars } from "@/components/product/product-rating-stars";

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

  return (
    <div className="pb-16">
      <nav className="mb-8 text-xs text-shop-muted" aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {crumbs.map((c, i) => (
            <li key={i} className="flex items-center gap-2">
              {i > 0 ? <span aria-hidden className="text-black/25">/</span> : null}
              {c.href ? (
                <Link href={c.href} className="hover:text-shop-ink hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span className="max-w-[min(100%,520px)] truncate font-medium text-shop-ink">{c.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 xl:gap-16">
        <ProductDetailGallery images={images} alt={imageAlt} />

        {/* Right panel */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-5">

            {/* Seller / brand row */}
            {eyebrow && (
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-500">{eyebrow}</p>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl font-bold leading-snug tracking-tight text-gray-900 md:text-[1.75rem]">
              {headline}
            </h1>

            {/* Stars + count */}
            <div className="flex items-center gap-2">
              <ProductRatingStars rating={rating} />
              {ratingCount != null && ratingCount > 0 && (
                <span className="text-sm text-gray-500">{ratingCount.toLocaleString()} ratings</span>
              )}
            </div>

            {/* Availability pill */}
            {availabilitySlot ? (
              <div>{availabilitySlot}</div>
            ) : null}

            {/* Price */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {priceCompareAt ? (
                <span className="text-lg font-normal tabular-nums text-gray-400 line-through">{priceCompareAt}</span>
              ) : null}
              <span className="text-4xl font-bold tabular-nums text-gray-900">{priceCurrent}</span>
              {discountLabel ? (
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-sm font-semibold text-red-500">{discountLabel}</span>
              ) : pct != null ? (
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-sm font-semibold text-red-500">-{pct}%</span>
              ) : null}
            </div>
            {priceMeta ? <div>{priceMeta}</div> : null}

            {/* Variant pickers */}
            {variantSlots?.map((slot, i) => (
              <section key={i}>
                <h2 className="mb-3 text-sm font-semibold text-gray-900">{slot.title}</h2>
                {slot.content}
              </section>
            ))}

            {/* Configuration prices table */}
            {configurationPricesSlot ? (
              <section className="border-t border-gray-100 pt-4">
                <h2 className="mb-1 text-sm font-semibold text-gray-900">Configuration prices</h2>
                <p className="mb-3 text-xs text-gray-400">Prices from the retailer for each build or SKU.</p>
                <div className="overflow-x-auto">{configurationPricesSlot}</div>
              </section>
            ) : null}

            {/* Quantity */}
            {quantitySlot ? (
              <section>
                <h2 className="mb-3 text-sm font-semibold text-gray-900">Quantity</h2>
                {quantitySlot}
              </section>
            ) : null}

            {/* Primary actions */}
            <div className="space-y-3 pt-1">{actionsSlot}</div>

            {/* Meta lines (retailer info, etc.) */}
            {metaLines?.length ? (
              <ul className="space-y-2 border-t border-gray-100 pt-4 text-sm">
                {metaLines.map((row, i) => (
                  <li key={i} className="text-gray-500">
                    <span className="text-gray-700">{row.label}</span>{" "}
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
        <div className="mt-14 rounded-2xl bg-gray-50 px-6 py-10 text-center sm:px-10 sm:py-12">
          <p className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">{promoBand.title}</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-500 sm:text-base">{promoBand.subtitle}</p>
        </div>
      ) : null}

      {footerSlot ? <div className="mt-12">{footerSlot}</div> : null}
    </div>
  );
}

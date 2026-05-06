import Link from "next/link";
import type { ProductDetailLayoutProps } from "@/types/product-detail";
import { ProductDetailGallery } from "@/components/product/product-detail-gallery";
import { ProductDetailTabs } from "@/components/product/product-detail-tabs";
import { ProductDetailZonesBelowStory } from "@/components/product/product-detail-zones";
import { ProductRatingStars } from "@/components/product/product-rating-stars";

export function ProductDetailLayout({
  crumbs,
  headline,
  tagline,
  images,
  imageAlt,
  priceCurrent,
  priceCompareAt,
  discountPercent,
  heroExcerpt,
  rating,
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
    discountPercent != null && discountPercent > 0 ? Math.min(99, Math.round(discountPercent)) : null;

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

        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="space-y-6">
            <ProductRatingStars rating={rating} />

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-shop-ink md:text-3xl lg:text-[1.75rem] lg:leading-snug">
                {headline}
              </h1>
              {tagline ? <p className="mt-2 text-sm text-shop-muted">{tagline}</p> : null}
            </div>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              {priceCompareAt ? (
                <span className="text-lg font-normal tabular-nums text-black/45 line-through">{priceCompareAt}</span>
              ) : null}
              <span className="text-3xl font-semibold tabular-nums text-shop-ink">{priceCurrent}</span>
              {pct != null ? (
                <span className="bg-black px-2 py-0.5 text-xs font-semibold tabular-nums text-white">-{pct}%</span>
              ) : null}
            </div>

            {heroExcerpt ? (
              <div className="text-sm leading-relaxed text-black/70 [&_p+_p]:mt-2">{heroExcerpt}</div>
            ) : null}

            {availabilitySlot ? (
              <p className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-shop-muted">Availability:</span>
                {availabilitySlot}
              </p>
            ) : null}

            {variantSlots?.map((slot, i) => (
              <section key={i} className="border-t border-black/10 pt-6 first:border-t-0 first:pt-0">
                <h2 className="text-sm font-semibold text-shop-ink">
                  {slot.title}
                  {slot.subtitle ? (
                    <span className="mt-1 block text-xs font-normal text-shop-muted">{slot.subtitle}</span>
                  ) : null}
                </h2>
                <div className="mt-3">{slot.content}</div>
              </section>
            ))}

            {configurationPricesSlot ? (
              <section className="border-t border-black/10 pt-6">
                <h2 className="text-sm font-semibold text-shop-ink">Configuration prices</h2>
                <p className="mt-1 text-xs text-shop-muted">Prices from the retailer for each build or SKU (when provided by the listing).</p>
                <div className="mt-3 overflow-x-auto">{configurationPricesSlot}</div>
              </section>
            ) : null}

            {quantitySlot ? (
              <section className="border-t border-black/10 pt-6">
                <h2 className="text-sm font-semibold text-shop-ink">Quantity</h2>
                <div className="mt-3">{quantitySlot}</div>
              </section>
            ) : null}

            <div className="space-y-3 pt-1">{actionsSlot}</div>

            {metaLines?.length ? (
              <ul className="space-y-2 border-t border-black/10 pt-6 text-sm text-shop-muted">
                {metaLines.map((row, i) => (
                  <li key={i}>
                    <span className="text-shop-ink/80">{row.label}</span>{" "}
                    <span className="text-shop-ink">{row.value}</span>
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
        <div className="mt-14 bg-black/4 px-6 py-14 text-center sm:px-10 sm:py-16">
          <p className="text-xl font-semibold tracking-tight text-shop-ink sm:text-2xl">{promoBand.title}</p>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-black/60 sm:text-base">{promoBand.subtitle}</p>
        </div>
      ) : null}

      {footerSlot ? <div className="mt-12">{footerSlot}</div> : null}
    </div>
  );
}

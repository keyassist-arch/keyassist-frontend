"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { useGetCatalogProductsQuery } from "@/store/routes/unified-commerce-api";
import { apiProductToProduct } from "@/lib/map-api-product-to-product";
import { formatApiMoney } from "@/lib/format-price";
import { getStorefrontActivitySignals } from "@/lib/storefront-activity";
import { productDetailPath } from "@/lib/product-detail-path";
import {
  LandingProductCard,
  LandingProductCardSkeleton,
  type LandingProduct,
} from "@/components/storefront/landing-product-card";

const BG_PALETTES = ["#F2F2F4", "#E9F8EE", "#F5F0E8", "#FFF3E0", "#E6F4F7"];

export function FeaturedProducts() {
  const { data, isLoading, isError } = useGetCatalogProductsQuery(5);

  const featuredItems: LandingProduct[] = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return data.slice(0, 5).map((apiProduct, index) => {
      const product = apiProductToProduct(apiProduct);
      const activity = getStorefrontActivitySignals(product.id);
      const rating = activity.rating.toFixed(1);
      const ratingCount =
        activity.reviewCount >= 1000
          ? `(${(activity.reviewCount / 1000).toFixed(1)}k)`
          : `(${activity.reviewCount})`;

      const onSale =
        product.discountPercent != null &&
        product.discountPercent > 0 &&
        product.compareAtPrice != null;

      return {
        id: product.id,
        slug: product.slug,
        title: product.title,
        store: product.seller?.trim() || product.marketplace || "Partner",
        rating,
        ratingCount,
        price: formatApiMoney(product.price, product.currency),
        comparePrice: onSale
          ? formatApiMoney(product.compareAtPrice, product.currency)
          : undefined,
        imageBg: BG_PALETTES[index % BG_PALETTES.length],
        imageUrl: product.images[0] || "/product-placeholder.svg",
        href: productDetailPath(product),
      };
    });
  }, [data]);

  return (
    <section
      className="w-full py-20"
      style={{
        background: "var(--background)",
        borderTop: "1px solid var(--shop-border)",
      }}
    >
      <div className="mx-auto flex max-w-(--shop-layout-max) flex-col gap-8 px-4 sm:px-8 lg:px-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-[32px] font-extrabold tracking-[-0.6px] text-shop-ink">
              Featured right now
            </h2>
            <p className="text-[15px] text-shop-muted">
              Live listings from Amazon, Apple, Nike and more
            </p>
          </div>
          <Link
            href="/shop"
            className="flex items-center gap-1.5 rounded-full border border-shop-border bg-white px-[18px] py-2.5 text-sm font-semibold text-shop-ink transition hover:border-shop-accent/40"
          >
            View all products
            <ArrowRight className="h-[15px] w-[15px]" aria-hidden />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <LandingProductCardSkeleton key={i} />
            ))}
          </div>
        ) : isError || featuredItems.length === 0 ? (
          <div className="rounded-[18px] border border-shop-border bg-white/60 p-12 text-center">
            <p className="text-base font-semibold text-shop-ink">No featured products found</p>
            <p className="mt-1 text-sm text-shop-muted">
              Check back soon or explore our full catalog.
            </p>
            <Link
              href="/shop"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-shop-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Browse Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {featuredItems.map((p) => (
              <LandingProductCard key={p.id || p.title} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

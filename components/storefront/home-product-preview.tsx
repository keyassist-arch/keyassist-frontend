"use client";

import Link from "next/link";
import type { Product } from "@/types";
import { StoreProductCard } from "@/components/storefront/store-product-card";

/** Number of cards on the homepage; full catalog lives on `/shop`. */
export const HOME_CATALOG_PREVIEW_COUNT = 5;

export function HomeProductPreview({ products }: { products: Product[] }) {
  const slice = products.slice(0, HOME_CATALOG_PREVIEW_COUNT);

  return (
    <section id="products" className="w-full scroll-mt-24 border-b bg-white py-10" style={{ borderColor: "var(--shop-border)" }}>
      <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
        <h2 className="text-xl font-semibold tracking-tight text-shop-ink">From the community catalog</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/65">
          A few listings other shoppers already scraped and saved—open the full shop for filters, sort, and everything in
          the catalog.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {slice.map((p) => (
            <StoreProductCard key={p.id} product={p} />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/shop" className="btn-primary inline-block text-center">
            Browse full shop
          </Link>
          <Link href="/shop" className="text-sm font-medium text-shop-accent hover:underline">
            Filters &amp; sort →
          </Link>
        </div>
      </div>
    </section>
  );
}

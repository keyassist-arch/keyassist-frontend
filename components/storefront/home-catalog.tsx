"use client";

import { useMemo } from "react";
import { useGetCatalogProductsQuery } from "@/store/routes/unified-commerce-api";
import { apiProductToProduct } from "@/lib/map-api-product-to-product";
import { HomeProductPreview } from "@/components/storefront/home-product-preview";
import { LatestPopular } from "@/components/storefront/latest-popular";
import { getErrorMessage } from "@/lib/rtk-error";

export function HomeCatalog() {
  const { data, isLoading, isError, error } = useGetCatalogProductsQuery();
  const products = useMemo(() => (data ?? []).map(apiProductToProduct), [data]);

  if (isLoading) {
    return (
      <section className="w-full border-b bg-white py-16" style={{ borderColor: "var(--shop-border)" }}>
        <div className="mx-auto max-w-(--shop-layout-max) px-4 text-center text-sm text-shop-muted sm:px-8">Loading catalog…</div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="w-full border-b bg-white py-16" style={{ borderColor: "var(--shop-border)" }}>
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-8">
          <p className="text-sm font-medium text-shop-ink">Could not load products</p>
          <p className="mt-2 text-sm text-shop-muted">{getErrorMessage(error)}</p>
        </div>
      </section>
    );
  }

  if (!products.length) {
    return (
      <section id="products" className="w-full scroll-mt-24 border-b bg-white py-16" style={{ borderColor: "var(--shop-border)" }}>
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-8">
          <p className="text-sm font-medium text-shop-ink">No products yet</p>
          <p className="mt-2 text-sm text-shop-muted">
            When shoppers save listings to the catalog, they’ll appear here so everyone can reuse them.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <HomeProductPreview products={products} />
      <LatestPopular products={products} />
    </>
  );
}

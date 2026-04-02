"use client";

import { useMemo } from "react";
import { useGetCatalogProductsQuery } from "@/store/routes/unified-commerce-api";
import { apiProductToProduct } from "@/lib/map-api-product-to-product";
import { CommunityCatalog } from "@/components/storefront/community-catalog";
import { ShopImportFromUrl } from "@/components/storefront/shop-import-from-url";
import { getErrorMessage } from "@/lib/rtk-error";
import Link from "next/link";

const layoutMax = "mx-auto max-w-[var(--shop-layout-max)] px-4 sm:px-8";

function ShopImportStrip() {
  return (
    <section className="w-full border-b bg-shop-surface py-8 sm:py-10" style={{ borderColor: "var(--shop-border)" }}>
      <div className={layoutMax}>
        <ShopImportFromUrl />
      </div>
    </section>
  );
}

export function ShopPageClient() {
  const { data, isLoading, isError, error } = useGetCatalogProductsQuery();
  const products = useMemo(() => (data ?? []).map(apiProductToProduct), [data]);

  return (
    <div className="w-full">
      <ShopImportStrip />

      {isLoading ? (
        <section className="w-full border-b bg-white py-16" style={{ borderColor: "var(--shop-border)" }}>
          <div className={`${layoutMax} text-center text-sm text-shop-muted`}>Loading shop…</div>
        </section>
      ) : null}

      {isError ? (
        <section className="w-full border-b bg-white py-16" style={{ borderColor: "var(--shop-border)" }}>
          <div className={`${layoutMax} text-center`}>
            <p className="text-sm font-medium text-shop-ink">Could not load the shop</p>
            <p className="mt-2 text-sm text-shop-muted">{getErrorMessage(error)}</p>
            <Link href="/" className="btn-secondary mt-4 inline-block">
              Back home
            </Link>
          </div>
        </section>
      ) : null}

      {!isLoading && !isError && !products.length ? (
        <section className="w-full border-b bg-white py-16" style={{ borderColor: "var(--shop-border)" }}>
          <div className={`${layoutMax} text-center`}>
            <p className="text-sm font-medium text-shop-ink">No products in the catalog yet</p>
            <p className="mt-2 text-sm text-shop-muted">
              Paste a marketplace link above to import one, or check back after others add listings.
            </p>
            <Link href="/" className="btn-secondary mt-4 inline-block">
              Back home
            </Link>
          </div>
        </section>
      ) : null}

      {!isLoading && !isError && products.length > 0 ? (
        <CommunityCatalog
          products={products}
          title="Shop"
          breadcrumbCurrent="Shop"
          sectionId="shop-catalog"
        />
      ) : null}
    </div>
  );
}

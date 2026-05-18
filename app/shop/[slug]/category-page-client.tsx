"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import {
  useGetCategoryQuery,
  useGetCategoryProductsQuery,
} from "@/store/routes/unified-commerce-api";
import { apiProductToProduct } from "@/lib/map-api-product-to-product";
import { StoreProductCard, StoreProductCardSkeleton } from "@/components/storefront/store-product-card";
import { LoadingState, ErrorState } from "@/components/feedback/query-state";
import { InnerShell } from "@/components/layout/inner-shell";

const PAGE_LIMIT = 24;

export function CategoryPageClient() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);

  const { data: category, isLoading: catLoading, isError: catError, error: catErr } =
    useGetCategoryQuery(slug, { skip: !slug });

  const { data: paginated, isLoading: productsLoading, isFetching: productsFetching } =
    useGetCategoryProductsQuery({ idOrSlug: slug, page, limit: PAGE_LIMIT }, { skip: !slug });

  const products = useMemo(() => (paginated?.results ?? []).map(apiProductToProduct), [paginated]);
  const totalPages = paginated ? Math.ceil(paginated.total / paginated.limit) : 0;

  if (catLoading) return <InnerShell><LoadingState label="Loading category…" /></InnerShell>;

  if (catError || !category) {
    return (
      <InnerShell>
        <ErrorState error={catErr} title="Category not found" />
        <Link href="/shop" className="btn-secondary mt-4 inline-block">Browse all</Link>
      </InnerShell>
    );
  }

  return (
    <div className="w-full bg-white">
      <div className="mx-auto max-w-(--shop-layout-max) px-4 py-8 sm:px-8">
        <nav className="text-xs text-gray-400" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/shop" className="hover:text-gray-700">Shop</Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-700">{category.name}</span>
        </nav>

        <motion.div className="mt-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{category.name}</h1>
          {category.description && <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{category.description}</p>}
          <p className="mt-1 text-xs text-gray-400">{category.productCount} {category.productCount === 1 ? "product" : "products"}</p>
        </motion.div>

        {productsLoading ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: PAGE_LIMIT }, (_, i) => <StoreProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-sm font-medium text-gray-800">No products in this category yet</p>
            <p className="mt-1 text-sm text-gray-400">Check back soon or browse other categories.</p>
            <Link href="/shop" className="btn-secondary mt-4 inline-block">Browse all</Link>
          </div>
        ) : (
          <motion.div
            className={`mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 transition-opacity ${productsFetching ? "opacity-60" : "opacity-100"}`}
            initial={{ opacity: 0 }} animate={{ opacity: productsFetching ? 0.6 : 1 }} transition={{ duration: 0.2 }}
          >
            {products.map((p) => <StoreProductCard key={p.id} product={p} />)}
          </motion.div>
        )}

        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:opacity-30" aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:opacity-30" aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <p className="mt-8 text-center text-[11px] text-gray-300">Prices and availability are confirmed at checkout.</p>
      </div>
    </div>
  );
}

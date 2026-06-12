"use client";

import Link from "next/link";
import { ArrowRight, Link2 } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { useGetCatalogProductsQuery } from "@/store/routes/unified-commerce-api";
import { apiProductToProduct } from "@/lib/map-api-product-to-product";
import { StoreProductCard } from "@/components/storefront/store-product-card";

const BRAND_COLOR = "#5C4AE6";

function ProductSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="h-[190px] animate-pulse bg-gray-100 sm:h-[210px]" />
      <div className="space-y-2 px-3 pb-4 pt-3">
        <div className="h-2.5 w-1/3 animate-pulse rounded-full bg-gray-100" />
        <div className="h-3.5 w-full animate-pulse rounded-full bg-gray-100" />
        <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-gray-100" />
        <div className="mt-3 h-4 w-1/4 animate-pulse rounded-full bg-gray-100" />
      </div>
    </div>
  );
}

export function HomeBrandCarousel() {
  const { data, isLoading } = useGetCatalogProductsQuery(8);
  const products = useMemo(() => (data ?? []).map(apiProductToProduct), [data]);
  const slice = products.slice(0, 8);

  return (
    <section className="w-full border-t border-gray-100 bg-white py-10">
      <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">

        {/* ── Header ── */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-gray-900">Featured products</h2>
            <p className="mt-0.5 text-sm text-gray-400">
              Live from Amazon, Apple, Nike &amp; more
            </p>
          </div>
          <Link
            href="/shop"
            className="flex shrink-0 items-center gap-1 text-sm font-medium transition hover:opacity-70"
            style={{ color: BRAND_COLOR }}
          >
            View all <ArrowRight size={14} strokeWidth={2.25} aria-hidden />
          </Link>
        </div>

        {/* ── Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : !slice.length ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center">
            <p className="text-sm font-medium text-gray-500">No products in the catalog yet.</p>
            <p className="mt-1 text-sm text-gray-400">Paste any product link above to add the first one.</p>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          >
            {slice.map((p) => (
              <motion.div
                key={p.id}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  show:  { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] } },
                }}
              >
                <StoreProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ── Import promo strip ── */}
        <motion.div
          className="mt-10 flex flex-col items-start justify-between gap-5 overflow-hidden rounded-2xl bg-gray-950 px-6 py-6 sm:flex-row sm:items-center sm:px-8"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="flex items-center gap-4">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: "rgba(92,74,230,0.25)" }}
            >
              <Link2 size={20} style={{ color: BRAND_COLOR }} aria-hidden />
            </span>
            <div>
              <p className="text-[15px] font-semibold text-white">
                Shop from anywhere — not just what&#8217;s here
              </p>
              <p className="mt-0.5 text-sm text-white/50">
                Paste any product link from Amazon, Farfetch, SSENSE, Grailed, and we&#8217;ll import it instantly.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-xl border border-white/10 bg-white/10 px-5 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/15"
            >
              Browse shop
            </Link>
            <Link
              href="/#hero-search"
              className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: BRAND_COLOR }}
            >
              Import a product
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

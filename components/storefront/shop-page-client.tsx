"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useGetCatalogProductsQuery, useGetCategoriesQuery } from "@/store/routes/unified-commerce-api";
import { StoreProductCardSkeleton } from "@/components/storefront/store-product-card";
import { apiProductToProduct } from "@/lib/map-api-product-to-product";
import { CommunityCatalog } from "@/components/storefront/community-catalog";
import { getErrorMessage } from "@/lib/rtk-error";
import { formatApiMoney } from "@/lib/format-price";
import { productDetailPath } from "@/lib/product-detail-path";
import { motion } from "framer-motion";
import type { Category } from "@/types/api";
import type { Product } from "@/types";

const CAT_PALETTE = [
  { bg: "#e8547a", text: "#fff" },
  { bg: "#d8ccc4", text: "#2a1800" },
  { bg: "#2d3a4a", text: "#fff" },
  { bg: "#c8956c", text: "#fff" },
  { bg: "#4a7c59", text: "#fff" },
  { bg: "#6b5b9f", text: "#fff" },
  { bg: "#3a7ca8", text: "#fff" },
  { bg: "#b8d5c8", text: "#2a1800" },
];

/* ── Product carousel ── */
function ProductCarousel({ products }: { products: Product[] }) {
  const slides = products.slice(0, 6);
  const count = slides.length;
  const [idx, setIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);

  const goTo = (i: number) => setIdx((count + i) % count);

  const startAuto = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (!pausedRef.current) setIdx((prev) => (prev + 1) % count);
    }, 4500);
  };

  useEffect(() => {
    if (!count) return;
    startAuto();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  if (!count) return null;

  const product = slides[idx];
  const image = product.images?.[0];

  return (
    <motion.div
      className="relative mx-auto max-w-(--shop-layout-max) px-4 sm:px-8"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
    >
      <div
        className="relative overflow-hidden rounded-3xl bg-gray-100"
        style={{ height: 340 }}
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
      >
        {/* Product image */}
        {image && (
          <motion.div
            key={`img-${product.id}`}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
          >
            <Image
              src={image}
              alt={product.title}
              fill
              className="object-cover"
              unoptimized
              priority={idx === 0}
            />
          </motion.div>
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)" }}
        />

        {/* Text */}
        <motion.div
          key={`text-${product.id}`}
          className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1], delay: 0.15 }}
        >
          {product.marketplace && (
            <span className="mb-2 w-fit rounded-full bg-white/15 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-widest text-white/90 backdrop-blur-sm">
              {product.marketplace}
            </span>
          )}
          <h2 className="line-clamp-2 max-w-lg text-xl font-bold leading-snug text-white sm:text-2xl">
            {product.title}
          </h2>
          <p className="mt-1.5 text-base font-semibold text-white/90 tabular-nums">
            {formatApiMoney(product.price, product.currency)}
          </p>
          <Link
            href={productDetailPath(product)}
            className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
          >
            View product <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>

        {/* Prev */}
        <button
          type="button"
          onClick={() => goTo(idx - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:bg-white"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4 text-gray-800" />
        </button>

        {/* Next */}
        <button
          type="button"
          onClick={() => goTo(idx + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:bg-white"
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4 text-gray-800" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 right-6 flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Slide ${i + 1}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === idx ? 20 : 6,
                background: i === idx ? "white" : "rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Carousel skeleton (while products load) ── */
function CarouselSkeleton() {
  return (
    <div className="relative mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
      <div className="h-[340px] animate-pulse rounded-3xl bg-gray-100" />
    </div>
  );
}

/* ── Browse categories row ── */
function BrowseCategories() {
  const { data: categories, isLoading } = useGetCategoriesQuery();

  return (
    <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
      <motion.h2
        className="mb-4 text-xl font-bold text-gray-900"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      >
        Browse categories
      </motion.h2>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="h-[110px] animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : (categories ?? []).length === 0 ? null : (
        <motion.div
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06 } },
          }}
        >
          {(categories ?? []).map((cat: Category, i: number) => {
            const palette = CAT_PALETTE[i % CAT_PALETTE.length];
            return (
              <motion.div
                key={cat.id}
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] } },
                }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
              >
                <Link
                  href={`/shop/${cat.slug}`}
                  className="relative flex h-[110px] items-end overflow-hidden rounded-2xl p-4 transition hover:opacity-90"
                  style={
                    cat.imageUrl
                      ? { backgroundImage: `url(${cat.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                      : { background: palette.bg }
                  }
                >
                  {cat.imageUrl && (
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" }} />
                  )}
                  <span
                    className="relative text-[13px] font-bold leading-tight"
                    style={{ color: cat.imageUrl ? "#fff" : palette.text }}
                  >
                    {cat.name}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

/* ── Main page ── */
export function ShopPageClient() {
  const { data, isLoading, isError, error } = useGetCatalogProductsQuery();
  const products = useMemo(() => (data ?? []).map(apiProductToProduct), [data]);

  return (
    <motion.div
      className="w-full bg-white"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {/* Explore heading */}
      <motion.div
        className="py-8 text-center"
        variants={{
          hidden: { opacity: 0, y: 10 },
          show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } },
        }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Explore</h1>
      </motion.div>

      {/* Product carousel */}
      {isLoading ? (
        <CarouselSkeleton />
      ) : (
        <ProductCarousel products={products} />
      )}

      {/* Browse categories */}
      <motion.section
        className="py-10"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
      >
        <BrowseCategories />
      </motion.section>

      {/* Catalog */}
      {isLoading && (
        <section className="border-t border-gray-100 py-8">
          <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
            <div className="h-7 w-40 animate-pulse rounded-full bg-gray-100" />
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {Array.from({ length: 12 }, (_, i) => <StoreProductCardSkeleton key={i} />)}
            </div>
          </div>
        </section>
      )}

      {isError && (
        <section className="border-t border-gray-100 py-16 text-center">
          <p className="text-sm font-medium text-gray-800">Could not load products</p>
          <p className="mt-1 text-sm text-gray-400">{getErrorMessage(error)}</p>
        </section>
      )}

      {!isLoading && !isError && products.length === 0 && (
        <section className="border-t border-gray-100 py-16 text-center">
          <p className="text-sm font-medium text-gray-800">No products in the catalog yet</p>
          <p className="mt-1 text-sm text-gray-400">
            Browse by category above or check back after listings are added.
          </p>
        </section>
      )}

      {!isLoading && !isError && products.length > 0 && (
        <motion.div
          className="border-t border-gray-100"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
        >
          <CommunityCatalog
            products={products}
            title="All products"
            breadcrumbCurrent="Shop"
            sectionId="shop-catalog"
          />
        </motion.div>
      )}
    </motion.div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useGetCatalogProductsQuery } from "@/store/routes/unified-commerce-api";
import { apiProductToProduct } from "@/lib/map-api-product-to-product";
import { CommunityCatalog } from "@/components/storefront/community-catalog";
import { getErrorMessage } from "@/lib/rtk-error";

/* ── Editorial carousel slides ── */
const SLIDES = [
  {
    id: "wedding",
    title: "Warm weather wedding looks",
    body: "Shop breezy midi dresses, wrap silhouettes, more",
    href: "/shop?q=wedding",
    gradient: "linear-gradient(135deg,#d8ccc4 0%,#c0b0a8 40%,#b8a89e 100%)",
    textBg: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
  },
  {
    id: "coastal",
    title: "Coastal style",
    body: "Shop elevated swim trunks, linen shirts, beachwear",
    href: "/shop?q=coastal",
    gradient: "linear-gradient(135deg,#a8c4d8 0%,#88aac4 40%,#6890b0 100%)",
    textBg: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
  },
  {
    id: "spf",
    title: "Sun-ready SPF",
    body: "Shop SPF sticks, tinted SPF, mineral sunscreens",
    href: "/shop?q=sunscreen",
    gradient: "linear-gradient(135deg,#e8d0b8 0%,#d4b898 40%,#c0a080 100%)",
    textBg: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)",
  },
  {
    id: "tech",
    title: "Tech essentials",
    body: "Shop earbuds, laptops, wearables across top stores",
    href: "/shop?q=tech",
    gradient: "linear-gradient(135deg,#1a1a2e 0%,#2d2d4e 40%,#3d3d6e 100%)",
    textBg: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)",
  },
];

/* ── Browse categories ── */
const BROWSE_CATS = [
  { label: "Beauty",     href: "/shop?q=beauty",     bg: "#e8547a", text: "#fff" },
  { label: "Womenswear", href: "/shop?q=women",       bg: "#d8ccc4", text: "#2a1800" },
  { label: "Menswear",   href: "/shop?q=men",          bg: "#2d3a4a", text: "#fff" },
  { label: "Home",       href: "/shop?q=home",         bg: "#c8956c", text: "#fff" },
  { label: "Fitness & nutrition", href: "/shop?q=fitness", bg: "#4a7c59", text: "#fff" },
];

/* ── Carousel ── */
function EditorialCarousel() {
  const [idx, setIdx] = useState(0);
  const slide = SLIDES[idx];

  return (
    <div className="relative mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
      <div className="relative overflow-hidden rounded-3xl" style={{ height: 340 }}>
        {/* Background */}
        <div
          className="absolute inset-0 transition-all duration-500"
          style={{ background: slide.gradient }}
        />
        {/* Decorative shape / person silhouette suggestion */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 90% at 65% 50%, rgba(255,255,255,0.08) 0%, transparent 70%)",
          }}
        />
        {/* Text overlay */}
        <div
          className="absolute inset-0 flex flex-col justify-end p-7"
          style={{ background: slide.textBg }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
            Curated collection
          </p>
          <h2 className="mt-1 text-2xl font-bold leading-tight text-white sm:text-3xl">
            {slide.title}
          </h2>
          <p className="mt-1 text-sm text-white/80">{slide.body}</p>
          <Link
            href={slide.href}
            className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/30"
          >
            Shop now <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Prev */}
        {idx > 0 && (
          <button
            type="button"
            onClick={() => setIdx(idx - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:bg-white"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-4 w-4 text-gray-800" />
          </button>
        )}

        {/* Next */}
        {idx < SLIDES.length - 1 && (
          <button
            type="button"
            onClick={() => setIdx(idx + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:bg-white"
            aria-label="Next slide"
          >
            <ChevronRight className="h-4 w-4 text-gray-800" />
          </button>
        )}

        {/* Dots */}
        <div className="absolute bottom-4 right-6 flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Slide ${i + 1}`}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === idx ? 20 : 6,
                background: i === idx ? "white" : "rgba(255,255,255,0.45)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Browse categories row ── */
function BrowseCategories() {
  return (
    <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
      <h2 className="mb-4 text-xl font-bold text-gray-900">Browse categories</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {BROWSE_CATS.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className="relative flex h-[110px] items-end overflow-hidden rounded-2xl p-4 transition hover:opacity-90"
            style={{ background: cat.bg }}
          >
            <span
              className="text-[13px] font-bold leading-tight"
              style={{ color: cat.text }}
            >
              {cat.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Main page ── */
export function ShopPageClient() {
  const { data, isLoading, isError, error } = useGetCatalogProductsQuery();
  const products = useMemo(() => (data ?? []).map(apiProductToProduct), [data]);

  return (
    <div className="w-full bg-white">
      {/* Explore heading */}
      <div className="py-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Explore</h1>
      </div>

      {/* Editorial carousel */}
      <EditorialCarousel />

      {/* Browse categories */}
      <section className="py-10">
        <BrowseCategories />
      </section>

      {/* Catalog */}
      {isLoading && (
        <section className="border-t border-gray-100 py-16 text-center text-sm text-gray-400">
          Loading products…
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
        <div className="border-t border-gray-100">
          <CommunityCatalog
            products={products}
            title="All products"
            breadcrumbCurrent="Shop"
            sectionId="shop-catalog"
          />
        </div>
      )}
    </div>
  );
}

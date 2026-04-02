"use client";

import Link from "next/link";
import { Suspense, useCallback, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/types";
import { StoreProductCard } from "@/components/storefront/store-product-card";

type SortKey = "recommend" | "price-asc" | "price-desc" | "title-asc";

const FILTER_PREVIEW = 6;

function CheckboxRow({
  id,
  label,
  checked,
  onChange,
  count,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  count?: number;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2 text-sm text-shop-ink">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded-none border-black/30 text-shop-primary focus:ring-shop-primary"
      />
      <span className="leading-snug">
        {label}
        {count != null ? <span className="text-black/40"> ({count})</span> : null}
      </span>
    </label>
  );
}

function FilterBlock({
  title,
  children,
  expanded,
  onToggleMore,
  hasMore,
}: {
  title: string;
  children: ReactNode;
  expanded: boolean;
  onToggleMore: () => void;
  hasMore: boolean;
}) {
  return (
    <div className="border-b border-black/10 py-4 last:border-b-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-black/60">{title}</h3>
      <div className="mt-3 space-y-2">{children}</div>
      {hasMore ? (
        <button
          type="button"
          onClick={onToggleMore}
          className="mt-2 text-xs font-medium text-shop-accent hover:underline"
        >
          {expanded ? "View less" : "View more"}
        </button>
      ) : null}
    </div>
  );
}

function CatalogFilters({
  categories,
  marketplaces,
  categoryCounts,
  marketplaceCounts,
  selectedCategories,
  setSelectedCategories,
  selectedMarketplaces,
  setSelectedMarketplaces,
  onSaleOnly,
  setOnSaleOnly,
  saleCount,
}: {
  categories: string[];
  marketplaces: string[];
  categoryCounts: Map<string, number>;
  marketplaceCounts: Map<string, number>;
  selectedCategories: Set<string>;
  setSelectedCategories: (s: Set<string>) => void;
  selectedMarketplaces: Set<string>;
  setSelectedMarketplaces: (s: Set<string>) => void;
  onSaleOnly: boolean;
  setOnSaleOnly: (v: boolean) => void;
  saleCount: number;
}) {
  const [catExpanded, setCatExpanded] = useState(false);
  const [mpExpanded, setMpExpanded] = useState(false);

  const catShow = catExpanded ? categories : categories.slice(0, FILTER_PREVIEW);
  const mpShow = mpExpanded ? marketplaces : marketplaces.slice(0, FILTER_PREVIEW);

  const toggleCat = (c: string, on: boolean) => {
    const next = new Set(selectedCategories);
    if (on) next.add(c);
    else next.delete(c);
    setSelectedCategories(next);
  };

  const toggleMp = (m: string, on: boolean) => {
    const next = new Set(selectedMarketplaces);
    if (on) next.add(m);
    else next.delete(m);
    setSelectedMarketplaces(next);
  };

  return (
    <>
      <FilterBlock
        title="Category"
        expanded={catExpanded}
        onToggleMore={() => setCatExpanded((v) => !v)}
        hasMore={categories.length > FILTER_PREVIEW}
      >
        {catShow.map((c) => (
          <CheckboxRow
            key={c}
            id={`cat-${c}`}
            label={c}
            checked={selectedCategories.has(c)}
            onChange={(on) => toggleCat(c, on)}
            count={categoryCounts.get(c)}
          />
        ))}
      </FilterBlock>

      <FilterBlock
        title="Source"
        expanded={mpExpanded}
        onToggleMore={() => setMpExpanded((v) => !v)}
        hasMore={marketplaces.length > FILTER_PREVIEW}
      >
        {mpShow.map((m) => (
          <CheckboxRow
            key={m}
            id={`mp-${m}`}
            label={m}
            checked={selectedMarketplaces.has(m)}
            onChange={(on) => toggleMp(m, on)}
            count={marketplaceCounts.get(m)}
          />
        ))}
      </FilterBlock>

      <div className="border-b border-black/10 py-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-black/60">Deals</h3>
        <div className="mt-3">
          <CheckboxRow
            id="filter-onsale"
            label="On sale only"
            checked={onSaleOnly}
            onChange={setOnSaleOnly}
            count={saleCount}
          />
        </div>
      </div>
    </>
  );
}

function CommunityCatalogInner({
  products,
  title,
  breadcrumbCurrent,
  sectionId,
}: {
  products: Product[];
  title: string;
  breadcrumbCurrent: string;
  sectionId: string;
}) {
  const searchParams = useSearchParams();
  const qRaw = searchParams.get("q")?.trim() ?? "";

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<Set<string>>(new Set());
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("recommend");

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products],
  );
  const marketplaces = useMemo(
    () => [...new Set(products.map((p) => p.marketplace).filter(Boolean))].sort(),
    [products],
  );

  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) {
      m.set(p.category, (m.get(p.category) ?? 0) + 1);
    }
    return m;
  }, [products]);

  const marketplaceCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) {
      m.set(p.marketplace, (m.get(p.marketplace) ?? 0) + 1);
    }
    return m;
  }, [products]);

  const saleCount = useMemo(
    () => products.filter((p) => p.discountPercent != null && p.discountPercent > 0).length,
    [products],
  );

  const filtered = useMemo(() => {
    let list = products;

    if (qRaw) {
      const qq = qRaw.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(qq) ||
          p.seller.toLowerCase().includes(qq) ||
          p.category.toLowerCase().includes(qq),
      );
    }

    if (selectedCategories.size > 0) {
      list = list.filter((p) => selectedCategories.has(p.category));
    }
    if (selectedMarketplaces.size > 0) {
      list = list.filter((p) => selectedMarketplaces.has(p.marketplace));
    }
    if (onSaleOnly) {
      list = list.filter((p) => p.discountPercent != null && p.discountPercent > 0);
    }

    const out = [...list];
    switch (sort) {
      case "price-asc":
        out.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        out.sort((a, b) => b.price - a.price);
        break;
      case "title-asc":
        out.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }
    return out;
  }, [products, qRaw, selectedCategories, selectedMarketplaces, onSaleOnly, sort]);

  const clearFilters = useCallback(() => {
    setSelectedCategories(new Set());
    setSelectedMarketplaces(new Set());
    setOnSaleOnly(false);
  }, []);

  const filterProps = {
    categories,
    marketplaces,
    categoryCounts,
    marketplaceCounts,
    selectedCategories,
    setSelectedCategories,
    selectedMarketplaces,
    setSelectedMarketplaces,
    onSaleOnly,
    setOnSaleOnly,
    saleCount,
  };

  return (
    <section id={sectionId} className="w-full scroll-mt-24 border-b bg-white py-10" style={{ borderColor: "var(--shop-border)" }}>
      <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
        <nav className="text-xs text-black/50" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-shop-ink hover:underline">
            Home
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-shop-ink">{breadcrumbCurrent}</span>
        </nav>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-shop-ink">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-black/65">
          Every item here was scraped from a real marketplace listing and saved by someone shopping on this store—so you
          can browse, compare, and cart it without digging up the original URL or running the scrape yourself.
        </p>
        {qRaw ? (
          <p className="mt-2 text-sm text-shop-accent">
            Filtered by search: <span className="font-medium text-shop-ink">&ldquo;{qRaw}&rdquo;</span>
          </p>
        ) : null}

        <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,220px)_1fr] lg:gap-12 xl:grid-cols-[minmax(0,240px)_1fr] xl:gap-14">
          <aside className="hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-wide text-black/50">Filters</p>
            <div className="mt-2">
              <CatalogFilters {...filterProps} />
            </div>
            {(selectedCategories.size > 0 || selectedMarketplaces.size > 0 || onSaleOnly) && (
              <button type="button" onClick={clearFilters} className="mt-4 text-xs font-medium text-shop-accent hover:underline">
                Clear all filters
              </button>
            )}
          </aside>

          <div>
            <details className="group mb-8 border border-black/10 bg-shop-surface p-4 lg:hidden">
              <summary className="cursor-pointer text-sm font-semibold text-shop-ink">Filters</summary>
              <div className="mt-4 border-t border-black/10 pt-4">
                <CatalogFilters {...filterProps} />
              </div>
              {(selectedCategories.size > 0 || selectedMarketplaces.size > 0 || onSaleOnly) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 text-xs font-medium text-shop-accent hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </details>

            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-none border border-shop-accent/40 bg-shop-accent-soft px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-shop-ink">
                  Community picks
                </span>
                <span className="text-sm text-black/50">
                  {filtered.length} {filtered.length === 1 ? "item" : "items"}
                </span>
              </div>
              <label className="flex items-center gap-2 text-sm text-shop-ink">
                <span className="text-black/55">Sort by</span>
                <select
                  className="input w-auto min-w-40 py-2 text-sm"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  aria-label="Sort products"
                >
                  <option value="recommend">Recommended</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="title-asc">Name: A–Z</option>
                </select>
              </label>
            </div>

            {filtered.length === 0 ? (
              <p className="mt-12 text-center text-sm text-black/55">
                No products match these filters.{" "}
                <button type="button" onClick={clearFilters} className="font-medium text-shop-accent hover:underline">
                  Reset filters
                </button>
              </p>
            ) : (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((p) => (
                  <StoreProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            <p className="mt-8 text-center text-[11px] leading-relaxed text-black/45">
              Star ratings and cart counts shown on cards are derived from activity on this storefront (for example, carts
              and product views), not from the original retailer’s reviews.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CatalogFallback() {
  return (
    <section className="w-full border-b bg-white py-10" style={{ borderColor: "var(--shop-border)" }}>
      <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
        <div className="h-8 w-48 animate-pulse rounded-none bg-black/10" />
        <div className="mt-4 h-4 max-w-xl animate-pulse rounded-none bg-black/10" />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-none bg-black/5" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function CommunityCatalog({
  products,
  title = "Community catalog",
  breadcrumbCurrent,
  sectionId = "shop-catalog",
}: {
  products: Product[];
  /** Main heading (use "Shop" on the dedicated shop page). */
  title?: string;
  /** Breadcrumb last segment; defaults to `title`. */
  breadcrumbCurrent?: string;
  /** Anchor id for deep links. */
  sectionId?: string;
}) {
  const crumb = breadcrumbCurrent ?? title;
  return (
    <Suspense fallback={<CatalogFallback />}>
      <CommunityCatalogInner
        products={products}
        title={title}
        breadcrumbCurrent={crumb}
        sectionId={sectionId}
      />
    </Suspense>
  );
}

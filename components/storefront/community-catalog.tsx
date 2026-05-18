"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/types";
import { StoreProductCard, StoreProductCardSkeleton } from "@/components/storefront/store-product-card";

type SortKey = "recommend" | "price-asc" | "price-desc" | "title-asc";

const FILTER_PREVIEW = 8;

/* ── Shared filter types ── */
type FilterProps = {
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
};

/* ── Checkbox row ── */
function CheckboxRow({
  id, label, checked, onChange, count,
}: {
  id: string; label: string; checked: boolean;
  onChange: (v: boolean) => void; count?: number;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-gray-700">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 accent-[#5C4AE6]"
      />
      <span className="flex-1 leading-snug">
        {label}
        {count != null && <span className="ml-1 text-gray-400">({count})</span>}
      </span>
    </label>
  );
}

/* ── Filter group ── */
function FilterGroup({
  title, children, expanded, onToggle, hasMore,
}: {
  title: string; children: ReactNode;
  expanded: boolean; onToggle: () => void; hasMore: boolean;
}) {
  return (
    <div className="border-b border-gray-100 py-5 last:border-0">
      <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">{title}</p>
      {children}
      {hasMore && (
        <button type="button" onClick={onToggle} className="mt-2 text-xs font-medium text-[#5C4AE6] hover:underline">
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}

/* ── All filters rendered ── */
function CatalogFilters(props: FilterProps) {
  const {
    categories, marketplaces, categoryCounts, marketplaceCounts,
    selectedCategories, setSelectedCategories,
    selectedMarketplaces, setSelectedMarketplaces,
    onSaleOnly, setOnSaleOnly, saleCount,
  } = props;

  const [catExp, setCatExp] = useState(false);
  const [mpExp, setMpExp] = useState(false);

  const catShow = catExp ? categories : categories.slice(0, FILTER_PREVIEW);
  const mpShow  = mpExp  ? marketplaces : marketplaces.slice(0, FILTER_PREVIEW);

  const toggleCat = (c: string, on: boolean) => {
    const s = new Set(selectedCategories);
    on ? s.add(c) : s.delete(c);
    setSelectedCategories(s);
  };
  const toggleMp = (m: string, on: boolean) => {
    const s = new Set(selectedMarketplaces);
    on ? s.add(m) : s.delete(m);
    setSelectedMarketplaces(s);
  };

  return (
    <>
      <FilterGroup title="Category" expanded={catExp} onToggle={() => setCatExp(v => !v)} hasMore={categories.length > FILTER_PREVIEW}>
        {catShow.map(c => (
          <CheckboxRow key={c} id={`cat-${c}`} label={c} checked={selectedCategories.has(c)} onChange={on => toggleCat(c, on)} count={categoryCounts.get(c)} />
        ))}
      </FilterGroup>

      <FilterGroup title="Source" expanded={mpExp} onToggle={() => setMpExp(v => !v)} hasMore={marketplaces.length > FILTER_PREVIEW}>
        {mpShow.map(m => (
          <CheckboxRow key={m} id={`mp-${m}`} label={m} checked={selectedMarketplaces.has(m)} onChange={on => toggleMp(m, on)} count={marketplaceCounts.get(m)} />
        ))}
      </FilterGroup>

      <FilterGroup title="Deals" expanded={false} onToggle={() => {}} hasMore={false}>
        <CheckboxRow id="filter-onsale" label="On sale only" checked={onSaleOnly} onChange={setOnSaleOnly} count={saleCount} />
      </FilterGroup>
    </>
  );
}

/* ── Filter modal ── */
function FilterModal({
  open, onClose, onClear, activeCount, filterProps,
}: {
  open: boolean; onClose: () => void; onClear: () => void;
  activeCount: number; filterProps: FilterProps;
}) {
  /* close on Escape */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  /* lock body scroll */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer — slides in from the right */}
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <p className="text-base font-bold text-gray-900">Filters</p>
              <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100" aria-label="Close filters">
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Scrollable filter list */}
            <div className="flex-1 overflow-y-auto px-6">
              <CatalogFilters {...filterProps} />
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
              {activeCount > 0 && (
                <button type="button" onClick={() => { onClear(); onClose(); }} className="flex-1 rounded-full border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                  Clear all
                </button>
              )}
              <button type="button" onClick={onClose} className="flex-1 rounded-full py-2.5 text-sm font-semibold text-white transition hover:opacity-90" style={{ background: "#5C4AE6" }}>
                Show results
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Inner catalog ── */
function CommunityCatalogInner({
  products, title, breadcrumbCurrent, sectionId,
}: {
  products: Product[]; title: string;
  breadcrumbCurrent: string; sectionId: string;
}) {
  const searchParams = useSearchParams();
  const qRaw = searchParams.get("q")?.trim() ?? "";

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<Set<string>>(new Set());
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("recommend");
  const [filterOpen, setFilterOpen] = useState(false);

  const categories  = useMemo(() => [...new Set(products.map(p => p.category).filter(Boolean))].sort(), [products]);
  const marketplaces = useMemo(() => [...new Set(products.map(p => p.marketplace).filter(Boolean))].sort(), [products]);

  const categoryCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) m.set(p.category, (m.get(p.category) ?? 0) + 1);
    return m;
  }, [products]);

  const marketplaceCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) m.set(p.marketplace, (m.get(p.marketplace) ?? 0) + 1);
    return m;
  }, [products]);

  const saleCount = useMemo(() => products.filter(p => (p.discountPercent ?? 0) > 0).length, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (qRaw) {
      const q = qRaw.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.seller.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
      );
    }
    if (selectedCategories.size > 0)  list = list.filter(p => selectedCategories.has(p.category));
    if (selectedMarketplaces.size > 0) list = list.filter(p => selectedMarketplaces.has(p.marketplace));
    if (onSaleOnly) list = list.filter(p => (p.discountPercent ?? 0) > 0);

    const out = [...list];
    if (sort === "price-asc")  out.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") out.sort((a, b) => b.price - a.price);
    if (sort === "title-asc")  out.sort((a, b) => a.title.localeCompare(b.title));
    return out;
  }, [products, qRaw, selectedCategories, selectedMarketplaces, onSaleOnly, sort]);

  const clearFilters = useCallback(() => {
    setSelectedCategories(new Set());
    setSelectedMarketplaces(new Set());
    setOnSaleOnly(false);
  }, []);

  const activeFilterCount =
    selectedCategories.size + selectedMarketplaces.size + (onSaleOnly ? 1 : 0);

  const filterProps: FilterProps = {
    categories, marketplaces, categoryCounts, marketplaceCounts,
    selectedCategories, setSelectedCategories,
    selectedMarketplaces, setSelectedMarketplaces,
    onSaleOnly, setOnSaleOnly, saleCount,
  };

  return (
    <section id={sectionId} className="w-full scroll-mt-24 bg-white py-8">
      <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">

        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-gray-700">Home</Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-700">{breadcrumbCurrent}</span>
        </nav>

        <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{title}</h2>

        {qRaw && (
          <p className="mt-1 text-sm text-[#5C4AE6]">
            Results for <span className="font-medium text-gray-900">&ldquo;{qRaw}&rdquo;</span>
          </p>
        )}

        {/* Toolbar */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Filter button */}
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: "#5C4AE6" }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

            <span className="text-sm text-gray-400">
              {filtered.length} {filtered.length === 1 ? "item" : "items"}
            </span>

            {activeFilterCount > 0 && (
              <button type="button" onClick={clearFilters} className="text-xs font-medium text-[#5C4AE6] hover:underline">
                Clear
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm outline-none transition hover:bg-gray-50"
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            aria-label="Sort products"
          >
            <option value="recommend">Recommended</option>
            <option value="price-asc">Price: low → high</option>
            <option value="price-desc">Price: high → low</option>
            <option value="title-asc">Name: A–Z</option>
          </select>
        </div>

        {/* Grid — 2 → 3 → 4 → 5 → 6 columns */}
        {filtered.length === 0 ? (
          <p className="mt-16 text-center text-sm text-gray-400">
            No products match these filters.{" "}
            <button type="button" onClick={clearFilters} className="font-medium text-[#5C4AE6] hover:underline">
              Reset
            </button>
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filtered.map(p => <StoreProductCard key={p.id} product={p} />)}
          </div>
        )}

        <p className="mt-8 text-center text-[11px] text-gray-300">
          Ratings and cart counts reflect activity on this storefront, not the original retailer.
        </p>
      </div>

      {/* Filter modal */}
      <FilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onClear={clearFilters}
        activeCount={activeFilterCount}
        filterProps={filterProps}
      />
    </section>
  );
}

/* ── Skeleton fallback ── */
function CatalogFallback() {
  return (
    <section className="bg-white py-8">
      <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
        <div className="h-7 w-40 animate-pulse rounded-full bg-gray-100" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => (
            <StoreProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Public export ── */
export function CommunityCatalog({
  products,
  title = "Community catalog",
  breadcrumbCurrent,
  sectionId = "shop-catalog",
}: {
  products: Product[];
  title?: string;
  breadcrumbCurrent?: string;
  sectionId?: string;
}) {
  return (
    <Suspense fallback={<CatalogFallback />}>
      <CommunityCatalogInner
        products={products}
        title={title}
        breadcrumbCurrent={breadcrumbCurrent ?? title}
        sectionId={sectionId}
      />
    </Suspense>
  );
}

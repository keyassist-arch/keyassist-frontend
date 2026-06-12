"use client";

import { ClipboardEvent, FormEvent, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Store, Link2, PackageCheck } from "lucide-react";
import { KeyAssistMark } from "@/components/ui/keyassist-logo";
import { useProductImportFromUrl } from "@/hooks/use-product-import-from-url";
import { ImportFailedModal } from "@/components/ui/import-failed-modal";
import { getErrorMessage } from "@/lib/rtk-error";
import { motion } from "framer-motion";

const BRAND_COLOR = "#5C4AE6";

type MarketplaceChip = {
  label: string;
  href: string;
  iconBg: string;
  slug?: string;
  hex?: string;
  initial?: string;
  initialColor?: string;
};

const MARKETPLACES: MarketplaceChip[] = [
  { label: "Amazon",   href: "/shop?q=amazon",   slug: "amazon",   hex: "FF9900", iconBg: "#FFF8EE" },
  { label: "Apple",    href: "/shop?q=apple",    slug: "apple",    hex: "555555", iconBg: "#F5F5F7" },
  { label: "Nike",     href: "/shop?q=nike",     slug: "nike",     hex: "111111", iconBg: "#F5F5F5" },
  { label: "GOAT",     href: "/shop?q=goat",     initial: "G",     initialColor: "#111", iconBg: "#F0F0F0" },
  { label: "Zara",     href: "/shop?q=zara",     slug: "zara",     hex: "000000", iconBg: "#F5F0E8" },
  { label: "eBay",     href: "/shop?q=ebay",     slug: "ebay",     hex: "E53238", iconBg: "#FFF0F0" },
  { label: "StockX",   href: "/shop?q=stockx",   slug: "stockx",   hex: "006380", iconBg: "#E8F5F7" },
  { label: "Converse", href: "/shop?q=converse",  slug: "converse", hex: "000000", iconBg: "#F5F5F5" },
];

const MINI_LOGOS = [
  { slug: "amazon",  hex: "FF9900", bg: "#FFF8EE" },
  { slug: "apple",   hex: "555555", bg: "#F5F5F7" },
  { slug: "nike",    hex: "111111", bg: "#F5F5F5" },
  { slug: "stockx",  hex: "006380", bg: "#E8F5F7" },
];

function looksLikeUrl(v: string) {
  return /^https?:\/\//i.test(v.trim());
}

export function HomeShopHero() {
  const router = useRouter();
  const searchId = useId();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    triggerImport,
    reset,
    lastAttemptedUrl,
    isImportBlocking,
    importErr,
    importError,
    effective,
    failed,
    waitCopy,
  } = useProductImportFromUrl();

  const importFailed = Boolean(importErr || failed);
  const failedMessage = failed
    ? (effective?.message ?? effective?.errorMessage)
    : importErr
      ? getErrorMessage(importError)
      : null;

  const handleRetry = () => {
    if (lastAttemptedUrl) triggerImport(lastAttemptedUrl);
  };

  const handleManualImport = () => {
    router.push(`/products/add-manual?url=${encodeURIComponent(lastAttemptedUrl)}`);
  };

  const handleDismiss = () => {
    reset();
  };

  const isUrl = looksLikeUrl(q);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const val = q.trim();
    if (!val) return;
    if (looksLikeUrl(val)) {
      triggerImport(val);
    } else {
      router.push(`/shop?q=${encodeURIComponent(val)}`);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (!looksLikeUrl(pasted)) return;
    e.preventDefault();
    setQ(pasted);
  };

  return (
    <motion.section
      className="w-full bg-white"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {/* Import overlay */}
      {isImportBlocking && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-black/60 px-6 py-10 backdrop-blur-sm"
          role="alertdialog"
          aria-busy="true"
          aria-live="polite"
          aria-label="Import in progress"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
          <div className="max-w-md text-center">
            <p className="text-base font-semibold text-white">Fetching product details…</p>
            <p className="mt-3 text-sm text-white/75">{waitCopy}</p>
          </div>
        </div>
      )}

      <ImportFailedModal
        open={importFailed}
        onClose={handleDismiss}
        onRetry={handleRetry}
        onManualImport={handleManualImport}
        errorMessage={failedMessage}
      />

      {/* ── Announcement bar ── */}
      <motion.div
        className="flex w-full items-center justify-center gap-2 bg-black px-4 py-2.5 text-[13px] font-medium text-white"
        variants={{
          hidden: { opacity: 0, y: -6 },
          show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } },
        }}
      >
        <KeyAssistMark size={22} className="shrink-0" />
        Download Key Assist app.&nbsp;Available on iOS &amp; Android
        <span className="ml-0.5 text-white/60" aria-hidden>→</span>
      </motion.div>

      {/* ── Hero body ── */}
      <div className="bg-white px-4 pb-10 pt-8 sm:px-8">

        {/* ── Trust cards ── */}
        <motion.div
          className="mx-auto mb-8 flex max-w-3xl items-stretch gap-3 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center sm:overflow-visible sm:px-0"
          variants={{
            hidden: { opacity: 0, y: 14 },
            show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } },
          }}
        >
          {/* Card 1 — Marketplaces */}
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:flex-1 sm:shrink">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(92,74,230,0.08)" }}>
              <Store size={18} style={{ color: BRAND_COLOR }} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">12 marketplaces</p>
              <div className="mt-1 flex items-center gap-1">
                {MINI_LOGOS.map(l => (
                  <span
                    key={l.slug}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: l.bg }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://cdn.simpleicons.org/${l.slug}/${l.hex}`} width={11} height={11} alt="" aria-hidden />
                  </span>
                ))}
                <span className="ml-0.5 text-[11px] text-gray-400">+8 more</span>
              </div>
            </div>
          </div>

          {/* Card 2 — Import any link */}
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:flex-1 sm:shrink">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "#FFF7ED" }}>
              <Link2 size={18} className="text-orange-400" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Paste any product link</p>
              <p className="text-[12px] text-gray-400">Auto-imports in seconds</p>
            </div>
          </div>

          {/* Card 3 — Nigerian delivery */}
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-[0_2px_12px_rgba(0,0,0,0.06)] sm:flex-1 sm:shrink">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "#F0FDF4" }}>
              <PackageCheck size={18} className="text-emerald-500" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">Delivered to Nigeria</p>
              <p className="text-[12px] text-gray-400">Lagos &amp; nationwide</p>
            </div>
          </div>
        </motion.div>

        {/* Brand + search + chips */}
        <div className="text-center">
          <motion.h1
            className="text-[60px] font-black leading-none tracking-tight sm:text-[72px] lg:text-[84px]"
            style={{ color: BRAND_COLOR }}
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.32, 0.72, 0, 1] } },
            }}
          >
            key assist
          </motion.h1>

          <motion.p
            className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500"
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.32, 0.72, 0, 1] } },
            }}
          >
            Shop Amazon, Apple, Nike, GOAT, Zara, eBay, StockX and more — or paste a product link to import it instantly.
          </motion.p>

          {/* Search / import bar */}
          <motion.form
            id="hero-search"
            onSubmit={onSubmit}
            className="mx-auto mt-5 max-w-[540px]"
            suppressHydrationWarning
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.32, 0.72, 0, 1] } },
            }}
          >
            <div
              className={`flex items-center rounded-full border bg-white px-5 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors ${
                isUrl ? "border-[#5C4AE6]/40" : "border-gray-200"
              }`}
            >
              <label htmlFor={searchId} className="sr-only">
                {isUrl ? "Import product from link" : "What are you shopping for today?"}
              </label>
              <input
                ref={inputRef}
                id={searchId}
                value={q}
                onChange={e => setQ(e.target.value)}
                onPaste={onPaste}
                placeholder="Search products or paste a link to import"
                className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                disabled={isImportBlocking}
                suppressHydrationWarning
              />
              <button
                type="submit"
                disabled={isImportBlocking}
                className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: BRAND_COLOR }}
                aria-label={isUrl ? "Import product" : "Search"}
                suppressHydrationWarning
              >
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
            {isUrl && (
              <p className="mt-2 text-center text-xs text-[#5C4AE6]">
                Product link detected — press Enter or ↵ to import
              </p>
            )}
          </motion.form>

          {/* Marketplace chips */}
          <motion.div
            className="mt-5 flex items-center justify-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.32, 0.72, 0, 1] } },
            }}
          >
            {MARKETPLACES.map(({ label, href, slug, hex, iconBg, initial, initialColor }) => (
              <motion.a
                key={label}
                href={href}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:shadow-md"
                whileHover={{ y: -1 }}
                transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ background: iconBg }}
                >
                  {slug ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://cdn.simpleicons.org/${slug}/${hex}`}
                      alt=""
                      width={14}
                      height={14}
                      aria-hidden
                    />
                  ) : (
                    <span className="text-[9px] font-black leading-none" style={{ color: initialColor ?? "#111" }}>
                      {initial ?? label[0]}
                    </span>
                  )}
                </span>
                {label}
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

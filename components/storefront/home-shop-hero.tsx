"use client";

import { ClipboardEvent, FormEvent, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowRight, Box, Globe, Link2, Plane, ReceiptText, ShieldCheck } from "lucide-react";
import { useProductImportFromUrl } from "@/hooks/use-product-import-from-url";
import { ImportFailedModal } from "@/components/ui/import-failed-modal";
import { getErrorMessage } from "@/lib/rtk-error";

const MARKETPLACE_CHIPS = [
  { label: "Amazon", bg: "#FFF3E0", color: "#B45200" },
  { label: "Apple", bg: "#F2F2F4", color: "#1A1A1A" },
  { label: "Nike", bg: "#F3F3F3", color: "#111111" },
  { label: "GOAT", bg: "#E9F8EE", color: "#0A6528" },
  { label: "StockX", bg: "#E6F4F7", color: "#006380" },
];

const TRUST_ITEMS = [
  { Icon: ShieldCheck, label: "Verified authenticity" },
  { Icon: ReceiptText, label: "Transparent all-in price" },
  { Icon: Plane, label: "Express air freight" },
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
    <section className="w-full bg-white">
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
        onClose={reset}
        onRetry={handleRetry}
        onManualImport={handleManualImport}
        errorMessage={failedMessage}
      />

      <div className="mx-auto flex max-w-(--shop-layout-max) flex-col items-center gap-14 px-4 py-16 sm:px-8 lg:flex-row lg:justify-between lg:gap-16 lg:px-24 lg:py-[72px]">
        {/* ── Hero Left ── */}
        <div className="flex w-full flex-col gap-[26px] lg:max-w-[620px]">
          <span
            className="inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-[7px] text-xs font-semibold"
            style={{ background: "var(--shop-accent-soft)", color: "var(--shop-primary)", border: "1px solid #CFF3E4" }}
          >
            <Globe className="h-3.5 w-3.5" aria-hidden />
            US marketplaces → delivered to Nigeria
          </span>

          <h1
            className="text-[42px] font-extrabold leading-[1.05] tracking-[-1.5px] text-shop-ink sm:text-[52px] lg:text-[62px]"
          >
            One cart for every US store you love.
          </h1>

          <p className="max-w-[520px] text-lg leading-[1.55] text-shop-muted">
            Shop Amazon, Apple, Nike, GOAT, Zara, eBay and StockX — or paste any product link. We buy it in the US,
            verify it, and air-freight it to your door in Lagos and nationwide.
          </p>

          {/* Search / import bar */}
          <form id="hero-search" onSubmit={onSubmit} className="w-full max-w-[540px]" suppressHydrationWarning>
            <div
              className="flex items-center gap-2.5 rounded-full bg-white py-2 pl-5 pr-2"
              style={{
                border: `1.5px solid ${isUrl ? "var(--shop-accent)" : "var(--shop-accent)"}`,
                boxShadow: "0 10px 30px 0 #10B98126",
              }}
            >
              <Link2 className="h-[18px] w-[18px] shrink-0 text-shop-muted" aria-hidden />
              <label htmlFor={searchId} className="sr-only">
                {isUrl ? "Import product from link" : "Search products"}
              </label>
              <input
                ref={inputRef}
                id={searchId}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onPaste={onPaste}
                placeholder="Search products or paste a link to import…"
                className="w-full bg-transparent text-[15px] text-shop-ink outline-none placeholder:text-shop-muted"
                disabled={isImportBlocking}
                suppressHydrationWarning
              />
              <button
                type="submit"
                disabled={isImportBlocking}
                className="flex shrink-0 items-center gap-2 rounded-full px-[22px] py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--shop-primary)" }}
                suppressHydrationWarning
              >
                Import
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </form>

          {/* Marketplace chips */}
          <div className="flex flex-wrap items-center gap-2.5">
            {MARKETPLACE_CHIPS.map(({ label, bg, color }) => (
              <span
                key={label}
                className="inline-flex items-center gap-[7px] rounded-full border border-shop-border px-[15px] py-2 text-sm font-semibold"
                style={{ background: bg, color }}
              >
                <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: color }} aria-hidden />
                {label}
              </span>
            ))}
            <span className="text-sm font-medium text-shop-muted">+7 more</span>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap items-center gap-6 pt-1.5">
            {TRUST_ITEMS.map(({ Icon, label }) => (
              <span key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" style={{ color: "var(--shop-primary)" }} aria-hidden />
                <span className="text-sm font-medium text-shop-ink">{label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ── Hero Visual ── */}
        <div className="relative hidden h-[520px] w-[520px] shrink-0 lg:block">
          <div
            className="absolute left-10 top-5 h-[460px] w-[460px] rounded-[200px]"
            style={{ background: "linear-gradient(135deg, #D9F7EA 0%, #F8F6F1 100%)" }}
            aria-hidden
          />

          <div
            className="absolute left-[70px] top-2.5 h-[440px] w-[360px] overflow-hidden rounded-[28px] border-[6px] border-white"
            style={{ boxShadow: "0 24px 60px -10px #11182726" }}
          >
            <Image
              src="https://images.unsplash.com/photo-1591370409347-2fd43b7842de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
              alt="Sneaker purchased through Key Assist"
              fill
              sizes="360px"
              className="object-cover"
              priority
            />
          </div>

          <div
            className="absolute left-0 top-[330px] flex w-[270px] flex-col gap-3 rounded-[20px] border border-shop-border bg-white p-[18px]"
            style={{ boxShadow: "0 16px 40px -8px #1118272E" }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
                style={{ background: "var(--background)" }}
              >
                <Box className="h-5 w-5" style={{ color: "var(--shop-primary)" }} aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-shop-muted">NIKE.COM</p>
                <p className="truncate text-[13px] font-semibold text-shop-ink">Air Max 1 &apos;87</p>
              </div>
            </div>
            {[
              ["Item price", "$140.00"],
              ["US procurement", "$18.00"],
              ["Air freight", "$32.00"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-[13px] text-shop-muted">{k}</span>
                <span className="text-[13px] font-medium text-shop-ink">{v}</span>
              </div>
            ))}
            <div className="h-px w-full bg-shop-border" />
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-shop-ink">All-in total</span>
              <span className="text-lg font-bold" style={{ color: "var(--shop-primary)" }}>$190.00</span>
            </div>
          </div>

          <div
            className="absolute left-[300px] top-10 flex items-center gap-[9px] rounded-full px-4 py-2.5"
            style={{ background: "var(--shop-dark)", boxShadow: "0 12px 28px -6px #1118273D" }}
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: "#34D399" }} aria-hidden />
            <span className="text-xs font-semibold text-white">In transit · Lagos</span>
          </div>
        </div>
      </div>
    </section>
  );
}

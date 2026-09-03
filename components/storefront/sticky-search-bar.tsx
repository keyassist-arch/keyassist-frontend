"use client";

import { ClipboardEvent, FormEvent, useId, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useProductImportFromUrl } from "@/hooks/use-product-import-from-url";
import { ImportFailedModal } from "@/components/ui/import-failed-modal";
import { getErrorMessage } from "@/lib/rtk-error";

const BRAND_COLOR = "#059669";

function looksLikeUrl(v: string) {
  return /^https?:\/\//i.test(v.trim());
}

export function StickySearchBar() {
  const router = useRouter();
  const searchId = useId();
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    triggerImport,
    reset,
    lastAttemptedUrl,
    hasApiBase,
    isImportBlocking,
    importErr,
    importError,
    effective,
    failed,
    waitCopy,
  } = useProductImportFromUrl();

  const isUrl = looksLikeUrl(q);
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

  useEffect(() => {
    const hero = document.getElementById("hero-search");

    if (!hero) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [mobileOpen]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const val = q.trim();
    if (!val) return;
    setMobileOpen(false);
    if (looksLikeUrl(val)) {
      setQ("");
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
    <>
      <ImportFailedModal
        open={importFailed}
        onClose={reset}
        onRetry={handleRetry}
        onManualImport={handleManualImport}
        errorMessage={failedMessage}
      />

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
            <p className="text-base font-semibold text-white">
              {effective?.userMessage ?? "On it — pulling in that listing"}
            </p>
            <p className="mt-3 text-sm text-white/75">{waitCopy}</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {visible && (
          <>
            {/* Desktop/tablet: full sticky search bar */}
            <motion.div
              key="sticky-search-desktop"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="fixed bottom-6 left-0 right-0 z-40 hidden justify-center px-4 md:flex"
            >
              <form onSubmit={onSubmit} className="w-full max-w-xl">
                <div
                  className={`flex items-center rounded-full border bg-white px-5 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.14)] transition-colors ${
                    isUrl ? "border-[#059669]/40" : "border-gray-200"
                  }`}
                >
                  <label htmlFor={searchId} className="sr-only">
                    {isUrl ? "Import product from link" : "What are you shopping for today?"}
                  </label>
                  <input
                    id={searchId}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onPaste={onPaste}
                    placeholder={isUrl ? "Paste a link to import" : "What are you shopping for today?"}
                    className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                    disabled={isImportBlocking}
                  />
                  <button
                    type="submit"
                    disabled={isImportBlocking}
                    className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: BRAND_COLOR }}
                    aria-label={isUrl ? "Import product" : "Search"}
                  >
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
                {isUrl && (
                  <p className="mt-1.5 text-center text-xs text-[#059669]">
                    Product link detected — press Enter or ↵ to import
                  </p>
                )}
              </form>
            </motion.div>

            {/* Mobile: floating search icon (FAB) — positioned above bottom nav */}
            <motion.button
              key="sticky-search-mobile-fab"
              type="button"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              onClick={() => setMobileOpen(true)}
              className="fixed right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full text-white shadow-[0_10px_36px_rgba(0,0,0,0.22)] md:hidden"
              style={{ background: BRAND_COLOR, bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
              aria-label="Open search"
            >
              <Search className="h-5 w-5" aria-hidden />
            </motion.button>

            <AnimatePresence>
              {mobileOpen && (
                <>
                  <motion.div
                    key="sticky-search-mobile-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="fixed inset-0 z-50 bg-black/40 md:hidden"
                    onClick={() => setMobileOpen(false)}
                  />
                  <motion.div
                    key="sticky-search-mobile-modal"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 16 }}
                    transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                    className="fixed inset-x-0 bottom-0 z-[60] p-4 md:hidden"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Search"
                  >
                    <form onSubmit={onSubmit} className="rounded-2xl border border-gray-200 bg-white p-3 shadow-[0_16px_60px_rgba(0,0,0,0.22)]">
                      <div className="flex items-center gap-2">
                        <label htmlFor={`${searchId}-mobile`} className="sr-only">
                          {isUrl ? "Import product from link" : "Search products"}
                        </label>
                        <input
                          ref={inputRef}
                          id={`${searchId}-mobile`}
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                          onPaste={onPaste}
                          placeholder={isUrl ? "Paste a link to import" : "Search or paste a product URL…"}
                          className="h-11 w-full rounded-xl bg-gray-50 px-4 text-sm text-gray-800 outline-none placeholder:text-gray-400"
                          disabled={isImportBlocking}
                        />
                        <button
                          type="button"
                          onClick={() => setMobileOpen(false)}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700"
                          aria-label="Close"
                        >
                          <X className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="submit"
                          disabled={isImportBlocking}
                          className="flex h-11 w-11 items-center justify-center rounded-xl text-white transition hover:opacity-90 disabled:opacity-50"
                          style={{ background: BRAND_COLOR }}
                          aria-label={isUrl ? "Import product" : "Search"}
                        >
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                      {isUrl && (
                        <p className="mt-2 text-center text-xs text-[#059669]">
                          Product link detected — tap Enter to import
                        </p>
                      )}
                    </form>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ErrorState } from "@/components/feedback/query-state";
import { useProductImportFromUrl } from "@/hooks/use-product-import-from-url";

/**
 * Marketplace URL import for the shop page — includes a full-screen overlay while the import runs.
 */
export function ShopImportFromUrl() {
  const {
    url,
    setUrl,
    onSubmit,
    hasApiBase,
    importing,
    importErr,
    importError,
    effective,
    failed,
    waiting,
    waitCopy,
    importId,
    isImportBlocking,
  } = useProductImportFromUrl();

  useEffect(() => {
    if (!hasApiBase || !isImportBlocking) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [hasApiBase, isImportBlocking]);

  if (!hasApiBase) {
    return null;
  }

  return (
    <>
      {isImportBlocking ? (
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
              {effective?.userMessage ?? (importing ? "Starting import…" : "Importing your product…")}
            </p>
            {effective?.phase ? (
              <p className="mt-2 text-sm capitalize text-white/80">
                Step: <span className="font-medium text-white">{effective.phase}</span>
              </p>
            ) : null}
            <p className="mt-3 text-sm text-white/75">{waitCopy}</p>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border bg-white p-4 sm:p-5" style={{ borderColor: "var(--shop-border)" }}>
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-shop-muted">Import</p>
        <h2 className="mt-1 text-lg font-semibold text-shop-ink">Add a product from a link</h2>
        <p className="mt-1 text-sm text-black/65">
          Paste a product URL from a supported marketplace. We&apos;ll fetch it and open the listing when it&apos;s ready.
        </p>
        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <input
            className="input flex-1"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.jumia.com.ng/..."
            aria-label="Marketplace product URL"
            disabled={isImportBlocking}
          />
          <button type="submit" className="btn-primary shrink-0 px-8 sm:w-auto" disabled={isImportBlocking}>
            {importing || (importId && waiting) ? "Importing…" : "Import product"}
          </button>
        </form>
        {importErr ? (
          <div className="mt-3">
            <ErrorState error={importError} title="Import failed" />
          </div>
        ) : null}
        {failed ? (
          <div className="mt-3">
            <ErrorState error={effective?.message ?? effective?.errorMessage ?? "Import failed"} title="Import failed" />
          </div>
        ) : null}
        <p className="mt-3 text-xs text-black/45">
          Imports may take a little while.{" "}
          <Link href="/faq" className="text-shop-accent underline hover:no-underline">
            FAQ
          </Link>
        </p>
      </div>
    </>
  );
}

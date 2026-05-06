"use client";

import Link from "next/link";
import { useId } from "react";
import { ErrorState, LoadingState } from "@/components/feedback/query-state";
import { useProductImportFromUrl } from "@/hooks/use-product-import-from-url";

export function UrlImportPanel() {
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
  } = useProductImportFromUrl();
  const importUrlId = useId();

  if (!hasApiBase) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Product import isn’t available until the storefront is connected to our services. Please try again later or contact support.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label htmlFor={importUrlId} className="min-w-0 flex-1 space-y-1 text-sm">
          <span className="text-black/70">Product URL</span>
          <input
            id={importUrlId}
            className="input w-full"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.jumia.com.ng/..."
          />
        </label>
        <button type="submit" className="btn-primary shrink-0" disabled={importing || (Boolean(importId) && waiting)}>
          {importing || (importId && waiting) ? "Adding…" : "Add from link"}
        </button>
      </form>
      {importErr && <ErrorState error={importError} title="Import failed" />}
      {failed && (
        <ErrorState error={effective?.message ?? effective?.errorMessage ?? "Import failed"} title="Import failed" />
      )}
      {importId && waiting ? (
        <div className="space-y-2 rounded-2xl border border-black/10 bg-shop-surface px-4 py-3 text-sm text-shop-muted">
          <LoadingState label={effective?.userMessage ?? "Getting your product ready…"} />
          <p className="text-xs text-black/50">{waitCopy}</p>
        </div>
      ) : null}
      <p className="text-xs text-black/50">
        Heavy use may be slowed to keep imports reliable. Questions? See our{" "}
        <Link href="/faq" className="text-shop-accent underline">
          FAQ
        </Link>
        .
      </p>
    </div>
  );
}

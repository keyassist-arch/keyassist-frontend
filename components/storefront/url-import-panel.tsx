"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId } from "react";
import { LoadingState } from "@/components/feedback/query-state";
import { useProductImportFromUrl } from "@/hooks/use-product-import-from-url";
import { ImportFailedModal } from "@/components/ui/import-failed-modal";
import { getErrorMessage } from "@/lib/rtk-error";

export function UrlImportPanel() {
  const router = useRouter();
  const {
    url,
    setUrl,
    onSubmit,
    triggerImport,
    reset,
    lastAttemptedUrl,
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

  if (!hasApiBase) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        Product import isn&apos;t available right now. Please try again shortly or contact support.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ImportFailedModal
        open={importFailed}
        onClose={handleDismiss}
        onRetry={handleRetry}
        onManualImport={handleManualImport}
        errorMessage={failedMessage}
      />

      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label htmlFor={importUrlId} className="min-w-0 flex-1 space-y-1 text-sm">
          <span className="text-black/70">Product URL</span>
          <input
            id={importUrlId}
            className="input w-full"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.amazon.com/..."
          />
        </label>
        <button type="submit" className="btn-primary shrink-0" disabled={importing || (Boolean(importId) && waiting)}>
          {importing || (importId && waiting) ? "Adding…" : "Add from link"}
        </button>
      </form>
      {importId && waiting ? (
        <div className="space-y-2 rounded-2xl border border-black/10 bg-shop-surface px-4 py-3 text-sm text-shop-muted">
          <LoadingState label="Fetching product details…" />
          <p className="text-xs text-black/50">{waitCopy}</p>
        </div>
      ) : null}
      <p className="text-xs text-black/50">
        We&apos;ll take you straight to the product page when it&apos;s ready. Questions? See our{" "}
        <Link href="/faq" className="text-shop-accent underline">
          FAQ
        </Link>
        .
      </p>
    </div>
  );
}

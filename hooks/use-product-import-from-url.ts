"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { useImportProductMutation, useLazyGetImportStatusQuery } from "@/store/routes/unified-commerce-api";
import { useImportRealtime } from "@/hooks/use-import-realtime";
import { coerceNumber } from "@/lib/coerce-number";
import { productDetailPathFromApi } from "@/lib/product-detail-path";
import type { ProductImportResponse } from "@/types/api";

function statusUpper(s: string | undefined) {
  return String(s ?? "").toUpperCase();
}

export function useProductImportFromUrl() {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [importId, setImportId] = useState<string | null>(null);
  const navigatedRef = useRef(false);
  const [postHint, setPostHint] = useState<ProductImportResponse | null>(null);
  const [socketPayload, setSocketPayload] = useState<ProductImportResponse | null>(null);
  const [pollPayload, setPollPayload] = useState<ProductImportResponse | null>(null);
  const [importProduct, { isLoading: importing, isError: importErr, error: importError }] = useImportProductMutation();
  const [pollImport] = useLazyGetImportStatusQuery();

  const effective = useMemo(
    () => socketPayload ?? pollPayload ?? postHint,
    [socketPayload, pollPayload, postHint]
  );

  useImportRealtime(
    importId,
    (payload) => {
      setSocketPayload(payload);
    },
    accessToken
  );

  useEffect(() => {
    if (!importId) return;
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const schedule = (ms: number) => {
      timeout = setTimeout(tick, ms);
    };

    const tick = async () => {
      if (cancelled || !importId) return;
      try {
        const result = await pollImport(importId).unwrap();
        if (cancelled) return;
        setPollPayload(result);
        const st = statusUpper(result.status);
        if (st === "COMPLETED" || st === "FAILED") return;
        const ms = Math.min(60_000, Math.max(1000, coerceNumber(result.pollAfterMs, 2500)));
        schedule(ms);
      } catch {
        if (!cancelled) schedule(5000);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [importId, pollImport]);

  useEffect(() => {
    if (!effective?.product?.id || navigatedRef.current) return;
    if (statusUpper(effective.status) !== "COMPLETED") return;
    navigatedRef.current = true;
    router.push(productDetailPathFromApi(effective.product));
  }, [effective, router]);

  const runImport = async (urlStr: string) => {
    navigatedRef.current = false;
    setImportId(null);
    setPostHint(null);
    setSocketPayload(null);
    setPollPayload(null);
    const trimmed = urlStr.trim();
    if (!trimmed) return;
    setUrl("");
    try {
      const res = await importProduct({ url: trimmed }).unwrap();
      if (res.requiresManualEntry) {
        router.push(`/products/add-manual?url=${encodeURIComponent(res.sourceUrl ?? trimmed)}`);
        return;
      }
      if (res.product?.id && statusUpper(res.status) === "COMPLETED") {
        router.push(productDetailPathFromApi(res.product));
        return;
      }
      if (res.importId) {
        setPostHint(res);
        setImportId(res.importId);
      }
    } catch {
      /* surfaced via importErr */
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await runImport(url);
  };

  /** Trigger an import with an explicit URL, without requiring a form event. */
  const triggerImport = (urlStr: string) => {
    setUrl(urlStr);
    void runImport(urlStr);
  };

  const hasApiBase = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);
  const failed = effective && statusUpper(effective.status) === "FAILED";
  const waiting = Boolean(importId) && !failed && statusUpper(effective?.status) !== "COMPLETED";
  const waitHint = effective?.typicalWaitSeconds;
  const waitCopy =
    waitHint?.min != null && waitHint?.max != null
      ? `Usually ready in ${waitHint.min}–${waitHint.max} seconds.`
      : "This usually takes under a minute.";

  /** True while POST is in flight or job is queued/processing (until success navigation or failure). */
  const isImportBlocking = Boolean(hasApiBase && (importing || (importId && waiting)));

  return {
    url,
    setUrl,
    onSubmit,
    triggerImport,
    hasApiBase,
    importing,
    importErr,
    importError,
    effective,
    failed,
    waiting,
    waitCopy,
    isImportBlocking,
    importId,
  };
}

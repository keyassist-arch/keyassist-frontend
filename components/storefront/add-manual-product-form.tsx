"use client";

import { FormEvent, useEffect, useId, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCreateManualProductMutation } from "@/store/routes/unified-commerce-api";
import { productDetailPathFromApi } from "@/lib/product-detail-path";
import { getErrorMessage } from "@/lib/rtk-error";
import { useAppSelector } from "@/store/hooks";
import { loginUrl } from "@/lib/auth-redirect";

const COMMON_CURRENCIES = ["NGN", "USD", "GBP", "EUR", "KES", "GHS", "ZAR"];

export function AddManualProductForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prefilledUrl = searchParams.get("url") ?? "";

  const token = useAppSelector((s) => s.auth.accessToken);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [description, setDescription] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [formError, setFormError] = useState("");

  const [createManualProduct, { isLoading, isError, error }] = useCreateManualProductMutation();

  const descriptionId = useId();
  const imageId = useId();
  const urlId = useId();

  const sourceUrl = prefilledUrl || manualUrl.trim();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!sourceUrl) {
      setFormError("Please enter the product URL.");
      return;
    }

    const imageUrls = imageInput
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    try {
      const res = await createManualProduct({
        sourceUrl,
        title: "Product Request",
        description: description.trim() || undefined,
        imageUrls: imageUrls.length ? imageUrls : undefined,
      }).unwrap();

      router.push(productDetailPathFromApi(res.product));
    } catch {
      /* surfaced via isError */
    }
  };

  if (mounted && !token) {
    const qs = searchParams.toString();
    const redirectTarget = qs ? `${pathname}?${qs}` : pathname;
    return (
      <div className="card max-w-lg space-y-4">
        <h2 className="text-lg font-semibold text-shop-ink">Sign in to submit this link</h2>
        <p className="text-sm text-shop-muted">
          Sign in so we can submit this request on your behalf and notify you within 24 hours.
        </p>
        <a href={loginUrl(redirectTarget)} className="btn-primary inline-block text-center">
          Sign in
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-900">
        <p className="font-semibold">24-Hour Estimate Guarantee</p>
        <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
          Submit your product link below. Our admin team will verify availability, pricing, and freight to provide a full landed cost estimate within 24 hours.
        </p>
      </div>

      {prefilledUrl ? (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-shop-ink">Product URL</label>
          <div className="rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black/80 break-all">
            {prefilledUrl}
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <label htmlFor={urlId} className="block text-sm font-medium text-shop-ink">
            Product URL <span className="text-red-500">*</span>
          </label>
          <input
            id={urlId}
            type="url"
            className="input w-full"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="https://www.example.com/product/..."
            required
          />
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor={descriptionId} className="block text-sm font-medium text-shop-ink">
          Description & Notes <span className="text-xs font-normal text-shop-muted">(Optional)</span>
        </label>
        <textarea
          id={descriptionId}
          className="input w-full min-h-[90px] resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Size, colour, specific model, or any details to help admin identify the exact product…"
          rows={3}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor={imageId} className="block text-sm font-medium text-shop-ink">
          Photo or Image Link <span className="text-xs font-normal text-shop-muted">(Optional)</span>
        </label>
        <input
          id={imageId}
          type="url"
          className="input w-full font-mono text-xs"
          value={imageInput}
          onChange={(e) => setImageInput(e.target.value)}
          placeholder="https://example.com/product-photo.jpg"
        />
      </div>

      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getErrorMessage(error) || "Something went wrong. Please check your details and try again."}
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary flex-1 sm:flex-none" disabled={isLoading}>
          {isLoading ? "Submitting request…" : "Submit link for estimate"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Back
        </button>
      </div>
    </form>
  );
}

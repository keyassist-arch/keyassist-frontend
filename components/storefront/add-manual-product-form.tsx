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
  // Avoids a hydration-mismatch flash of the sign-in gate for already-logged-in users
  // while the persisted auth token rehydrates client-side (same pattern as checkout-client.tsx).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [imageInput, setImageInput] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [formError, setFormError] = useState("");

  const [createManualProduct, { isLoading, isError, error }] = useCreateManualProductMutation();

  const titleId = useId();
  const priceId = useId();
  const currencyId = useId();
  const brandId = useId();
  const descriptionId = useId();
  const imageId = useId();
  const urlId = useId();

  const sourceUrl = prefilledUrl || manualUrl.trim();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    const parsedPrice = parseFloat(price);
    if (!title.trim()) {
      setFormError("Enter the product name.");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setFormError("Enter a valid price.");
      return;
    }
    if (!sourceUrl) {
      setFormError("Enter the product's URL.");
      return;
    }

    const imageUrls = imageInput
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    try {
      const res = await createManualProduct({
        title: title.trim(),
        price: parsedPrice,
        currency,
        brand: brand.trim() || undefined,
        description: description.trim() || undefined,
        imageUrls: imageUrls.length ? imageUrls : undefined,
        sourceUrl,
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
        <h2 className="text-lg font-semibold text-shop-ink">Sign in to add this product</h2>
        <p className="text-sm text-shop-muted">
          Sign in so we can submit this on your behalf and let you track it in your orders.
        </p>
        <a href={loginUrl(redirectTarget)} className="btn-primary inline-block text-center">
          Sign in
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {prefilledUrl ? (
        <div className="rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black/60 break-all">
          <span className="font-medium text-black/80">URL: </span>
          {prefilledUrl}
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
        <label htmlFor={titleId} className="block text-sm font-medium text-shop-ink">
          Product name <span className="text-red-500">*</span>
        </label>
        <input
          id={titleId}
          className="input w-full"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Nike Air Max 90"
          required
          maxLength={500}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={priceId} className="block text-sm font-medium text-shop-ink">
            Price <span className="text-red-500">*</span>
          </label>
          <input
            id={priceId}
            type="number"
            min="0.01"
            step="0.01"
            className="input w-full"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 25000"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor={currencyId} className="block text-sm font-medium text-shop-ink">
            Currency <span className="text-red-500">*</span>
          </label>
          <select
            id={currencyId}
            className="input w-full"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {COMMON_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor={brandId} className="block text-sm font-medium text-shop-ink">
          Brand
        </label>
        <input
          id={brandId}
          className="input w-full"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          placeholder="e.g. Nike"
          maxLength={200}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor={descriptionId} className="block text-sm font-medium text-shop-ink">
          Description
        </label>
        <textarea
          id={descriptionId}
          className="input w-full min-h-[100px] resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short product description…"
          rows={4}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor={imageId} className="block text-sm font-medium text-shop-ink">
          Image URLs
        </label>
        <p className="text-xs text-black/50">One URL per line (up to 20)</p>
        <textarea
          id={imageId}
          className="input w-full font-mono text-xs min-h-[80px] resize-y"
          value={imageInput}
          onChange={(e) => setImageInput(e.target.value)}
          placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"}
          rows={3}
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
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? "Adding product…" : "Add product"}
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

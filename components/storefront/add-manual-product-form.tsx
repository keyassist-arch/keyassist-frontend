"use client";

import { FormEvent, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreateManualProductMutation } from "@/store/routes/unified-commerce-api";
import { productDetailPathFromApi } from "@/lib/product-detail-path";
import { getErrorMessage } from "@/lib/rtk-error";

const COMMON_CURRENCIES = ["NGN", "USD", "GBP", "EUR", "KES", "GHS", "ZAR"];

export function AddManualProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceUrl = searchParams.get("url") ?? "";

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [imageInput, setImageInput] = useState("");

  const [createManualProduct, { isLoading, isError, error }] = useCreateManualProductMutation();

  const titleId = useId();
  const priceId = useId();
  const currencyId = useId();
  const brandId = useId();
  const descriptionId = useId();
  const imageId = useId();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(price);
    if (!title.trim() || isNaN(parsedPrice) || parsedPrice <= 0 || !sourceUrl) return;

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

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {sourceUrl && (
        <div className="rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-black/60 break-all">
          <span className="font-medium text-black/80">URL: </span>
          {sourceUrl}
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

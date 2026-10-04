"use client";

import { ChangeEvent, DragEvent, FormEvent, useEffect, useId, useState } from "react";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Loader2, Plus, Trash2, UploadCloud } from "lucide-react";
import {
  useCreateManualProductMutation,
  useUploadImageMutation,
} from "@/store/routes/unified-commerce-api";
import { productDetailPathFromApi } from "@/lib/product-detail-path";
import { getErrorMessage } from "@/lib/rtk-error";
import { useAppSelector } from "@/store/hooks";
import { loginUrl } from "@/lib/auth-redirect";

export function AddManualProductForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prefilledUrl = searchParams.get("url") ?? "";

  const token = useAppSelector((s) => s.auth.accessToken);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const [description, setDescription] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formError, setFormError] = useState("");

  const [createManualProduct, { isLoading, isError, error }] = useCreateManualProductMutation();
  const [uploadImage] = useUploadImageMutation();

  const descriptionId = useId();
  const urlId = useId();
  const imageInputId = useId();

  const sourceUrl = prefilledUrl || manualUrl.trim();

  const handleFiles = async (files: FileList | File[]) => {
    setFormError("");
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        setFormError("Only image files (JPG, PNG, WebP) are allowed.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFormError(`Image "${file.name}" exceeds the 10MB limit.`);
        return;
      }
      validFiles.push(file);
    }

    if (!validFiles.length) return;

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of validFiles) {
        const res = await uploadImage(file).unwrap();
        uploadedUrls.push(res.url);
      }
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err) {
      setFormError(getErrorMessage(err) || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addManualImageUrl = () => {
    const trimmed = manualImageUrl.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//i.test(trimmed)) {
      setFormError("Please enter a valid HTTP or HTTPS image URL.");
      return;
    }
    setImages((prev) => [...prev, trimmed]);
    setManualImageUrl("");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!sourceUrl) {
      setFormError("Please enter the product URL.");
      return;
    }
    if (isUploading) {
      setFormError("Please wait for your images to finish uploading.");
      return;
    }

    try {
      const res = await createManualProduct({
        sourceUrl,
        title: "Product Request",
        description: description.trim() || undefined,
        imageUrls: images.length ? images : undefined,
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

      {/* Image Upload Zone */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-shop-ink">
          Product Photos <span className="text-xs font-normal text-shop-muted">(Optional — Upload images from device)</span>
        </label>

        {/* Drag and Drop Box */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
            dragActive
              ? "border-[#059669] bg-emerald-50/50"
              : "border-black/10 bg-black/[0.01] hover:border-black/20 hover:bg-black/[0.02]"
          }`}
        >
          <input
            id={imageInputId}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            multiple
            disabled={isUploading}
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <UploadCloud className="h-6 w-6" />
              )}
            </div>
            <div>
              <label
                htmlFor={imageInputId}
                className="cursor-pointer text-sm font-semibold text-emerald-700 hover:text-emerald-800 underline"
              >
                Click to upload
              </label>
              <span className="text-sm text-shop-muted"> or drag and drop photos</span>
            </div>
            <p className="text-xs text-shop-muted">PNG, JPG or WebP up to 10MB each</p>
          </div>
        </div>

        {/* Uploaded Images Preview Strip */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((imgUrl, index) => (
              <div
                key={index}
                className="group relative aspect-square overflow-hidden rounded-xl border border-black/10 bg-gray-50"
              >
                <Image
                  src={imgUrl}
                  alt={`Product reference photo ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Optional URL input fallback */}
        <div className="flex gap-2 pt-1">
          <input
            type="url"
            className="input flex-1 font-mono text-xs"
            value={manualImageUrl}
            onChange={(e) => setManualImageUrl(e.target.value)}
            placeholder="Or paste an image web link (https://...)"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addManualImageUrl();
              }
            }}
          />
          <button
            type="button"
            onClick={addManualImageUrl}
            className="btn-secondary px-3 py-2 text-xs font-semibold"
          >
            <Plus className="mr-1 h-3.5 w-3.5 inline" /> Add link
          </button>
        </div>
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
        <button
          type="submit"
          className="btn-primary flex-1 sm:flex-none"
          disabled={isLoading || isUploading}
        >
          {isLoading ? "Submitting request…" : isUploading ? "Uploading photos…" : "Submit link for estimate"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.back()}
          disabled={isLoading || isUploading}
        >
          Back
        </button>
      </div>
    </form>
  );
}

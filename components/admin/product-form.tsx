"use client";

import { useId, useMemo, useState } from "react";
import { Plus, Trash2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetCategoriesQuery,
  useGetUploadSignatureMutation,
} from "@/store/routes/unified-commerce-api";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload";
import { getErrorMessage } from "@/lib/rtk-error";
import type {
  AdminCreateProductRequest,
  AdminProductConfigurationPriceRequest,
  ApiProduct,
} from "@/types/api";

const MAX_CONFIGURATION_ROWS = 50;

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-[#059669]/20";
const labelCls = "block text-xs font-semibold text-gray-700 mb-1.5";

type VariantDraft = { name: string; optionsText: string };

function cartesian(variants: { name: string; options: string[] }[]): Record<string, string>[] {
  return variants.reduce<Record<string, string>[]>(
    (acc, variant) =>
      acc.flatMap((combo) =>
        variant.options.map((option) => ({ ...combo, [variant.name]: option })),
      ),
    [{}],
  );
}

function comboKey(selections: Record<string, string>): string {
  return Object.entries(selections)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
}

export function ProductForm({
  initial,
  submitLabel,
  submitting,
  onSubmit,
}: {
  initial?: ApiProduct;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (body: AdminCreateProductRequest) => Promise<void>;
}) {
  const { data: categories } = useGetCategoriesQuery();
  const [getUploadSignature] = useGetUploadSignatureMutation();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [originalPrice, setOriginalPrice] = useState(String(initial?.originalPrice ?? ""));
  const [compareAtPrice, setCompareAtPrice] = useState(
    initial?.compareAtPrice ? String(initial.compareAtPrice) : "",
  );
  const [availability, setAvailability] = useState(initial?.availability ?? "In Stock");
  const [stockQuantity, setStockQuantity] = useState(
    initial?.stockQuantity != null ? String(initial.stockQuantity) : "",
  );

  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [uploading, setUploading] = useState(false);

  const initialVariants = (initial?.variants as { name: string; options: string[] }[] | undefined) ?? [];
  const [variants, setVariants] = useState<VariantDraft[]>(
    initialVariants.map((v) => ({ name: v.name, optionsText: v.options.join(", ") })),
  );
  const [configRows, setConfigRows] = useState<AdminProductConfigurationPriceRequest[]>(
    (initial?.configurationPrices as AdminProductConfigurationPriceRequest[] | undefined) ?? [],
  );

  const titleFieldId = useId();

  const parsedVariants = useMemo(
    () =>
      variants
        .filter((v) => v.name.trim() && v.optionsText.trim())
        .map((v) => ({
          name: v.name.trim(),
          options: Array.from(
            new Set(
              v.optionsText
                .split(",")
                .map((o) => o.trim())
                .filter(Boolean),
            ),
          ),
        })),
    [variants],
  );

  const combinationCount = useMemo(
    () => parsedVariants.reduce((n, v) => n * v.options.length, parsedVariants.length ? 1 : 0),
    [parsedVariants],
  );

  const addVariant = () => setVariants((prev) => [...prev, { name: "", optionsText: "" }]);
  const removeVariant = (index: number) =>
    setVariants((prev) => prev.filter((_, i) => i !== index));

  const generateCombinations = () => {
    if (parsedVariants.length === 0) {
      toast.error("Add at least one variant with options first.");
      return;
    }
    if (combinationCount > MAX_CONFIGURATION_ROWS) {
      toast.error(
        `That's ${combinationCount} combinations — keep it under ${MAX_CONFIGURATION_ROWS} (fewer axes or options).`,
      );
      return;
    }
    const combos = cartesian(parsedVariants);
    const existingByKey = new Map(
      configRows
        .filter((r) => r.variantSelections)
        .map((r) => [comboKey(r.variantSelections!), r]),
    );
    setConfigRows(
      combos.map((selections) => {
        const existing = existingByKey.get(comboKey(selections));
        return (
          existing ?? {
            label: Object.values(selections).join(" — "),
            originalPrice: originalPrice || "0",
            variantSelections: selections,
            available: true,
          }
        );
      }),
    );
  };

  const updateConfigRow = (
    key: string,
    patch: Partial<AdminProductConfigurationPriceRequest>,
  ) => {
    setConfigRows((prev) =>
      prev.map((row) =>
        row.variantSelections && comboKey(row.variantSelections) === key
          ? { ...row, ...patch }
          : row,
      ),
    );
  };

  const onFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const sig = await getUploadSignature().unwrap();
        const url = await uploadImageToCloudinary(file, sig);
        uploaded.push(url);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    const price = parseFloat(originalPrice);
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Enter a valid base price.");
      return;
    }
    if (images.length === 0) {
      toast.error("Add at least one image.");
      return;
    }

    const body: AdminCreateProductRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      brand: brand.trim() || undefined,
      originalPrice: price,
      images,
      variants: parsedVariants.length ? parsedVariants : undefined,
      configurationPrices: configRows.length ? configRows : undefined,
      stockQuantity: stockQuantity.trim() ? parseInt(stockQuantity, 10) : undefined,
      categoryId: categoryId || undefined,
      availability: availability.trim() || undefined,
      compareAtPrice: compareAtPrice.trim() ? parseFloat(compareAtPrice) : undefined,
    };

    await onSubmit(body);
  };

  return (
    <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-6">
      {/* Basics */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Basics</h2>
        <div>
          <label htmlFor={titleFieldId} className={labelCls}>Title *</label>
          <input
            id={titleFieldId}
            className={inputCls}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nike Air Force 1 Low"
            required
          />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            className={inputCls}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Brand</label>
            <input className={inputCls} value={brand} onChange={(e) => setBrand(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <select
              className={inputCls}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Uncategorized</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Pricing &amp; availability</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Base price (USD) *</label>
            <input
              type="number" min="0" step="0.01"
              className={inputCls}
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={labelCls}>Compare-at price</label>
            <input
              type="number" min="0" step="0.01"
              className={inputCls}
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              placeholder="Optional was-price"
            />
          </div>
          <div>
            <label className={labelCls}>Availability</label>
            <input className={inputCls} value={availability} onChange={(e) => setAvailability(e.target.value)} />
          </div>
        </div>
        {parsedVariants.length === 0 && (
          <div>
            <label className={labelCls}>Stock quantity</label>
            <input
              type="number" min="0" step="1"
              className={`${inputCls} max-w-xs`}
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              placeholder="Leave blank for unlimited"
            />
          </div>
        )}
      </section>

      {/* Images */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Images *</h2>
        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div key={url + i} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </div>
          ))}
          <label className="flex h-20 w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-gray-300 text-gray-400 hover:border-[#059669] hover:text-[#059669] transition">
            <Upload className="h-5 w-5" aria-hidden />
            <span className="text-[10px] font-medium">{uploading ? "Uploading…" : "Add"}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => { void onFilesSelected(e.target.files); e.target.value = ""; }}
            />
          </label>
        </div>
      </section>

      {/* Variants */}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Variants</h2>
          <button
            type="button"
            onClick={addVariant}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add axis
          </button>
        </div>
        {variants.length === 0 && (
          <p className="text-xs text-gray-400">No variants — this product sells as a single item.</p>
        )}
        {variants.map((v, i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] items-end">
            <div>
              <label className={labelCls}>Axis name</label>
              <input
                className={inputCls}
                placeholder="Size"
                value={v.name}
                onChange={(e) =>
                  setVariants((prev) => prev.map((row, idx) => (idx === i ? { ...row, name: e.target.value } : row)))
                }
              />
            </div>
            <div>
              <label className={labelCls}>Options (comma-separated)</label>
              <input
                className={inputCls}
                placeholder="S, M, L"
                value={v.optionsText}
                onChange={(e) =>
                  setVariants((prev) =>
                    prev.map((row, idx) => (idx === i ? { ...row, optionsText: e.target.value } : row)),
                  )
                }
              />
            </div>
            <button
              type="button"
              onClick={() => removeVariant(i)}
              className="mb-0.5 rounded-xl p-2.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
              aria-label="Remove axis"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
        {parsedVariants.length > 0 && (
          <button
            type="button"
            onClick={generateCombinations}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            style={{ background: "#059669" }}
          >
            Generate {combinationCount} price row{combinationCount === 1 ? "" : "s"}
          </button>
        )}
      </section>

      {/* Configuration prices */}
      {configRows.length > 0 && (
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Per-variant pricing &amp; stock</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-gray-500">
                  <th className="pb-2 pr-3">Combination</th>
                  <th className="pb-2 pr-3">Price (USD)</th>
                  <th className="pb-2 pr-3">SKU</th>
                  <th className="pb-2 pr-3">Stock</th>
                  <th className="pb-2">In stock</th>
                </tr>
              </thead>
              <tbody>
                {configRows.map((row) => {
                  const key = row.variantSelections ? comboKey(row.variantSelections) : row.label;
                  return (
                    <tr key={key} className="border-t border-gray-100">
                      <td className="py-2 pr-3 text-gray-700">{row.label}</td>
                      <td className="py-2 pr-3">
                        <input
                          type="number" min="0" step="0.01"
                          className={`${inputCls} py-1.5`}
                          value={row.originalPrice}
                          onChange={(e) => updateConfigRow(key, { originalPrice: e.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          className={`${inputCls} py-1.5`}
                          value={row.sku ?? ""}
                          onChange={(e) => updateConfigRow(key, { sku: e.target.value })}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number" min="0" step="1"
                          className={`${inputCls} py-1.5`}
                          value={row.stockQuantity ?? ""}
                          onChange={(e) =>
                            updateConfigRow(key, {
                              stockQuantity: e.target.value ? parseInt(e.target.value, 10) : undefined,
                            })
                          }
                        />
                      </td>
                      <td className="py-2">
                        <input
                          type="checkbox"
                          checked={row.available ?? true}
                          onChange={(e) => updateConfigRow(key, { available: e.target.checked })}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
          style={{ background: "#059669" }}
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

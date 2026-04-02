import type { ApiProduct, ApiProductVariantDimension } from "@/types/api";

function isDimensionArray(v: unknown): v is ApiProductVariantDimension[] {
  if (!Array.isArray(v) || v.length === 0) return false;
  return v.every(
    (item) =>
      item != null &&
      typeof item === "object" &&
      typeof (item as { name?: unknown }).name === "string" &&
      Array.isArray((item as { options?: unknown }).options),
  );
}

/**
 * Normalized variant dimensions from `GET /products/:id`.
 * Supports `{ name, options[] }[]` and a legacy array of flat rows for older payloads.
 */
export function getVariantDimensions(product: ApiProduct): ApiProductVariantDimension[] {
  const v = product.variants;
  if (!v) return [];

  if (isDimensionArray(v)) {
    return v
      .filter((d) => d.name?.trim() && d.options?.length)
      .map((d) => ({
        name: d.name.trim(),
        options: d.options.map((o) => String(o)),
      }));
  }

  if (Array.isArray(v)) {
    const comboLabels: string[] = [];
    for (const row of v) {
      if (row && typeof row === "object" && !Array.isArray(row)) {
        const o = row as Record<string, unknown>;
        const name = typeof o.name === "string" ? o.name : "Option";
        const value =
          typeof o.value === "string"
            ? o.value
            : typeof o[name] === "string"
              ? (o[name] as string)
              : (Object.values(o).find((x) => typeof x === "string")?.toString() ?? "");
        if (value) comboLabels.push(`${name}: ${value}`);
      }
    }
    if (comboLabels.length) return [{ name: "Configuration", options: comboLabels }];
  }

  if (typeof v === "object" && !Array.isArray(v)) {
    const entries = Object.entries(v as Record<string, unknown>).filter(([, val]) => typeof val === "string") as [
      string,
      string,
    ][];
    if (entries.length === 1) {
      const [k, val] = entries[0];
      return [{ name: k, options: [val] }];
    }
  }

  return [];
}

/** First option per dimension — default PDP / card selection. */
export function defaultVariantSelection(dimensions: ApiProductVariantDimension[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of dimensions) {
    const first = d.options[0];
    if (first != null) out[d.name] = first;
  }
  return out;
}

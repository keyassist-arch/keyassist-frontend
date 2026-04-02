import type { ApiProduct } from "@/types/api";

/**
 * Canonical storefront path for a product. Prefer API `slug` for readable URLs; fall back to UUID.
 * Cart/order APIs still use `productId` = `id` (UUID).
 */
export function productDetailPath(product: { id: string; slug?: string | null }): string {
  const slug = product.slug?.trim();
  if (slug) return `/products/${encodeURIComponent(slug)}`;
  return `/products/${encodeURIComponent(product.id)}`;
}

export function productDetailPathFromApi(api: Pick<ApiProduct, "id" | "slug">): string {
  return productDetailPath(api);
}

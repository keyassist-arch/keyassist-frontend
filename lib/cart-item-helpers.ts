import type { ApiProduct, CartItemResponse } from "@/types/api";
import { coerceNumber } from "@/lib/coerce-number";
import { normalizeImageUrls } from "@/lib/normalize-image-urls";

export function lineUnitPrice(item: CartItemResponse): number {
  const p = item.product;
  if (p && "title" in p) {
    const prod = p as ApiProduct;
    return coerceNumber(prod.salePrice ?? prod.originalPrice ?? 0, 0);
  }
  return 0;
}

export function linePrice(item: CartItemResponse): number {
  return lineUnitPrice(item) * item.quantity;
}

export function lineTitle(item: CartItemResponse): string {
  const p = item.product;
  return p && "title" in p ? (p as ApiProduct).title : "Product";
}

export function lineCurrency(item: CartItemResponse): string {
  const p = item.product;
  return p && "currency" in p ? ((p as ApiProduct).currency ?? "USD") : "USD";
}

export function lineImage(item: CartItemResponse): string {
  const p = item.product;
  if (p && "images" in p) {
    const imgs = normalizeImageUrls((p as ApiProduct).images);
    if (imgs.length) return imgs[0];
  }
  return "/product-placeholder.svg";
}

export function lineBrand(item: CartItemResponse): string {
  const p = item.product;
  if (p && "brand" in p) {
    const b = (p as ApiProduct).brand?.trim();
    if (b) return b;
  }
  return "Store";
}

import type { Product, ProductVariant } from "@/types";
import type { ApiProduct } from "@/types/api";
import { coerceNumber } from "@/lib/coerce-number";
import { defaultVariantSelection, getVariantDimensions } from "@/lib/api-product-variants";
import { pricesAreEqual } from "@/lib/format-price";
import { marketplaceFromApiSource, retailerLabelFromSource } from "@/lib/product-source";

const UNLIMITED_STOCK = 999_999;

/** Maps API catalog rows to storefront `Product` for grids and local cart. */
export function apiProductToProduct(api: ApiProduct): Product {
  const dimensions = getVariantDimensions(api);
  const selection = defaultVariantSelection(dimensions);
  const variants: ProductVariant[] = Object.entries(selection).map(([name, value], i) => ({
    id: `v-${i}`,
    name,
    value,
  }));

  const price = coerceNumber(api.salePrice ?? api.originalPrice ?? 0, 0);
  const original = coerceNumber(api.originalPrice, 0);
  const stock = api.stockQuantity == null ? UNLIMITED_STOCK : coerceNumber(api.stockQuantity, 0);

  // Prefer adapter-provided compareAtPrice over originalPrice
  const adapterCompareAt = api.compareAtPrice ? coerceNumber(api.compareAtPrice, 0) : 0;
  const compareAtRaw = adapterCompareAt > price ? adapterCompareAt : original;

  let compareAtPrice: number | undefined;
  let discountPercent: number | undefined;
  if (
    compareAtRaw > 0 &&
    price > 0 &&
    price < compareAtRaw &&
    !pricesAreEqual(compareAtRaw, api.salePrice)
  ) {
    compareAtPrice = compareAtRaw;
    discountPercent = Math.min(99, Math.round((1 - price / compareAtRaw) * 100));
  }

  // Use raw discount text as percent when possible
  if (api.discount) {
    const parsed = parseInt(api.discount.replace(/[^0-9]/g, ""), 10);
    if (Number.isFinite(parsed) && parsed > 0 && parsed <= 99) {
      discountPercent = parsed;
    }
  }

  return {
    id: api.id,
    slug: api.slug ?? undefined,
    marketplace: marketplaceFromApiSource(api.source, api.brand),
    title: api.title,
    description: api.description ?? "",
    price,
    currency: api.currency || "USD",
    images: api.images?.length ? api.images : ["/product-placeholder.svg"],
    variants,
    category: api.brand?.trim() ?? (api.source ? retailerLabelFromSource(api.source) : "Catalog"),
    collection: "Store",
    seller: api.brand ?? api.source ?? "Seller",
    stock,
    compareAtPrice,
    discountPercent,
    deliveryEstimate: "Set at checkout",
    highlights: api.highlights,
    attributes: api.attributes,
    compliance: api.compliance,
    whatsInTheBox: api.whatsInTheBox,
  };
}

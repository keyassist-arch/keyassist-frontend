import type { Marketplace } from "@/types";
import type { ProductSource } from "@/types/api";

const SOURCE_LABELS: Record<ProductSource, string> = {
  amazon: "Amazon",
  nike: "Nike",
  apple: "Apple",
  generic: "Partner",
  goat: "GOAT",
  zara: "Zara",
  converse: "Converse",
  ebay: "eBay",
  stockx: "StockX",
  etsy: "Etsy",
  reebelo: "Reebelo",
  walmart: "Walmart",
  backmarket: "Back Market",
  keyassist: "Key Assist",
};

/** Display name for “View on {retailer}”. */
export function retailerLabelFromSource(source: string | undefined): string {
  if (!source?.trim()) return "Retailer";
  const key = source.toLowerCase() as ProductSource;
  return SOURCE_LABELS[key] ?? source;
}

/** Maps API `source` enum to storefront `Marketplace` badge. */
export function marketplaceFromApiSource(source: string | undefined, brand?: string | null): Marketplace {
  const s = source?.toLowerCase();
  switch (s) {
    case "amazon":
      return "Amazon";
    case "apple":
      return "Apple";
    case "nike":
      return "Nike";
    case "generic":
      return "Partner";
    case "goat":
      return "GOAT";
    case "zara":
      return "Zara";
    case "converse":
      return "Converse";
    case "ebay":
      return "eBay";
    case "stockx":
      return "StockX";
    case "etsy":
      return "Etsy";
    case "reebelo":
      return "Reebelo";
    case "walmart":
      return "Walmart";
    case "backmarket":
      return "Back Market";
    case "keyassist":
      return "Key Assist";
    default: {
      const b = brand?.trim();
      if (b && ["Amazon", "Apple", "Nike", "Shopify Partner"].includes(b)) return b as Marketplace;
      return "Partner";
    }
  }
}

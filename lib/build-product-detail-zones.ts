import type { ApiProduct } from "@/types/api";
import type { ProductAttribute, ProductDetailZones } from "@/types/product-detail";
import { splitProductDescription } from "@/lib/product-description-sections";

const BULLET_PREFIX = /^\s*(?:[-*•]|\d+[.)])\s+/;

function extractBulletLinesFromSummary(summary: string): string[] {
  if (!summary.trim()) return [];
  const out: string[] = [];
  for (const line of summary.split(/\n+/)) {
    const t = line.trim();
    if (BULLET_PREFIX.test(t)) {
      const stripped = t.replace(BULLET_PREFIX, "").trim();
      if (stripped) out.push(stripped);
    }
  }
  return out.slice(0, 8);
}

function normalizeAttributes(raw: ProductAttribute[] | undefined): ProductAttribute[] {
  return (raw ?? []).filter((a) => a.key?.trim() && a.value?.trim());
}

function zonesFromParts(parts: {
  highlights: string[];
  attributes: ProductAttribute[];
  compliance: string[];
  whatsInTheBox: string[];
}): ProductDetailZones {
  return {
    highlights: parts.highlights.length ? parts.highlights : undefined,
    attributes: parts.attributes.length ? parts.attributes : undefined,
    compliance: parts.compliance.length ? parts.compliance : undefined,
    whatsInTheBox: parts.whatsInTheBox.length ? parts.whatsInTheBox : undefined,
  };
}

/**
 * Maps API product + description summary into PDP zones.
 * Uses API `highlights` when present; otherwise bullet lines from the description lead.
 */
export function buildProductDetailZonesFromApi(api: ApiProduct): ProductDetailZones {
  // Guard: scraper may return highlights as objects rather than strings
  const explicit = (api.highlights ?? []).filter((h) => typeof h === "string" && h.trim());
  const { summary } = splitProductDescription(api.description);
  const fromBullets = explicit.length === 0 ? extractBulletLinesFromSummary(summary) : [];
  const highlights = explicit.length ? explicit : fromBullets;

  return zonesFromParts({
    highlights,
    attributes: normalizeAttributes(api.attributes),
    compliance: api.compliance?.filter(Boolean) ?? [],
    whatsInTheBox: api.whatsInTheBox?.filter(Boolean) ?? [],
  });
}

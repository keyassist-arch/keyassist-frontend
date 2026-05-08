import type { ReactNode } from "react";

/** Generic trail: last item is usually current page (omit href). */
export interface ProductDetailCrumb {
  label: string;
  href?: string;
}

export interface ProductDetailVariantSlot {
  /** e.g. "Finish." — Apple-style step label */
  title: string;
  subtitle?: string;
  content: ReactNode;
}

export interface ProductDetailDescriptionBlock {
  title?: string;
  content: ReactNode;
}

/** Key/value facts for specs tables; optional `group` renders under a subheading. */
export interface ProductAttribute {
  key: string;
  value: string;
  group?: string;
}

/**
 * Brand-agnostic PDP zones: highlights + specs above long-form copy;
 * compliance + in-the-box after story blocks.
 */
export interface ProductDetailZones {
  highlights?: string[];
  attributes?: ProductAttribute[];
  compliance?: string[];
  whatsInTheBox?: string[];
}

export interface ProductDetailLayoutProps {
  crumbs: ProductDetailCrumb[];
  /** Small line above title — brand / marketplace / source */
  eyebrow?: string;
  headline: string;
  /** Optional one-liner under headline (availability, tagline) */
  tagline?: string;
  images: string[];
  imageAlt: string;
  /** e.g. “Our price” above the main amount (hidden in storefront PDP theme). */
  priceSectionLabel?: string;
  priceCurrent: string;
  priceCompareAt?: string;
  /** e.g. “Retailer list” beside struck-through compare price. */
  priceCompareLabel?: string;
  /** Integer percent for sale badge, e.g. 14 → “-14%”. */
  discountPercent?: number | null;
  /** Short lead under the price row (first paragraph / summary). */
  heroExcerpt?: ReactNode;
  /** 0–5 filled stars; omit for all-outline stars. */
  rating?: number;
  /** Total review/rating count shown next to stars. */
  ratingCount?: number;
  /** Styled availability row (dot, low-stock copy). */
  availabilitySlot?: ReactNode;
  variantSlots?: ProductDetailVariantSlot[];
  /** Optional table (e.g. API `configurationPrices` for Apple-style SKU rows). Rendered after variant pickers. */
  configurationPricesSlot?: ReactNode;
  quantitySlot?: ReactNode;
  actionsSlot: ReactNode;
  /** Seller notes, retailer link — below primary actions */
  metaLines?: { label: string; value: ReactNode }[];
  detailZones?: ProductDetailZones;
  descriptionBlocks?: ProductDetailDescriptionBlock[];
  /** Full-width text band below tabs (no image). */
  promoBand?: { title: string; subtitle: string };
  /** Optional full-width area at bottom (e.g. legal / refresh note) */
  footerSlot?: ReactNode;
}

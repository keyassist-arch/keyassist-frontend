import type { Metadata } from "next";
import { ProductPageClient } from "./product-page-client";
import { retailerLabelFromSource } from "@/lib/product-source";
import { coerceNumber } from "@/lib/coerce-number";
import { normalizeImageUrls } from "@/lib/normalize-image-urls";
import type { ApiProduct } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

async function fetchProductMeta(idOrSlug: string): Promise<ApiProduct | null> {
  if (!API_BASE) return null;
  try {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(idOrSlug)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function buildMetaDescription(product: ApiProduct, retailer: string): string {
  const raw = product.description?.replace(/\s+/g, " ").trim() ?? "";
  if (raw.length > 10) {
    return raw.length > 155 ? `${raw.slice(0, 152)}…` : raw;
  }
  const brand = product.brand?.trim() || retailer;
  return `Shop ${product.title}${brand ? ` by ${brand}` : ""} on Key Assist. Compare prices and buy from top marketplaces in one cart.`;
}

function buildProductJsonLd(product: ApiProduct, siteUrl: string) {
  const price = coerceNumber(product.salePrice ?? product.originalPrice, 0);
  const currency = product.currency ?? "USD";
  const stock = product.stockQuantity;
  const inStock = stock == null || coerceNumber(stock, 0) > 0;
  const pdpSlug = product.slug ?? product.id;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    ...(product.description ? { description: product.description.slice(0, 500) } : {}),
    image: normalizeImageUrls(product.images).slice(0, 5),
    ...(product.brand?.trim()
      ? { brand: { "@type": "Brand", name: product.brand.trim() } }
      : {}),
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${pdpSlug}`,
      price: price > 0 ? price.toFixed(2) : undefined,
      priceCurrency: currency,
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProductMeta(slug);

  if (!product) {
    return { title: "Product not found" };
  }

  const retailer = retailerLabelFromSource(product.source);
  const brand = product.brand?.trim() || retailer;
  const title = brand ? `${product.title} — ${brand}` : product.title;
  const description = buildMetaDescription(product, retailer);
  const normalizedImages = normalizeImageUrls(product.images);
  const images = normalizedImages.slice(0, 1).map((url) => ({
    url,
    width: 800,
    height: 800,
    alt: product.title,
  }));

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: normalizedImages.slice(0, 1),
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const product = await fetchProductMeta(slug);
  const jsonLd = product && siteUrl ? buildProductJsonLd(product, siteUrl) : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductPageClient />
    </>
  );
}

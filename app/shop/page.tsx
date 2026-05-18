import type { Metadata } from "next";
import { ShopPageClient } from "@/components/storefront/shop-page-client";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse marketplace listings from Amazon, Nike, Apple, GOAT and more — filter, sort, and add to cart without re-pasting every URL.",
  openGraph: {
    title: "Shop — Key Assist",
    description: "Browse marketplace listings from Amazon, Nike, Apple, GOAT and more.",
    type: "website",
  },
};

export default function ShopPage() {
  return <ShopPageClient />;
}

import type { Metadata } from "next";
import { ShopPageClient } from "@/components/storefront/shop-page-client";

export const metadata: Metadata = {
  title: "Shop — Community catalog",
  description:
    "Browse marketplace listings saved by shoppers on this store—filter, sort, and cart without re-pasting every URL.",
};

export default function ShopPage() {
  return <ShopPageClient />;
}

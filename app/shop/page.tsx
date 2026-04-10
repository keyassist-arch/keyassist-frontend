import type { Metadata } from "next";
import { ShopPageClient } from "@/components/storefront/shop-page-client";

export const metadata: Metadata = {
  title: "Shop — Key Assist",
  description:
    "Browse marketplace listings on Key Assist—filter, sort, and cart without re-pasting every URL.",
};

export default function ShopPage() {
  return <ShopPageClient />;
}

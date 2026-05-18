import type { Metadata } from "next";
import { HomeShopHero } from "@/components/storefront/home-shop-hero";
import { HomeCategoryGrid } from "@/components/storefront/home-category-grid";
import { HomeBrandCarousel } from "@/components/storefront/home-brand-carousel";

export const metadata: Metadata = {
  openGraph: {
    title: "Key Assist — Shop from Multiple Marketplaces",
    description:
      "Search, discover, and buy products from Amazon, Apple, Nike, Jumia and more — all from one place.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Key Assist — Shop from Multiple Marketplaces",
    description:
      "Search, discover, and buy products from Amazon, Apple, Nike, Jumia and more — all from one place.",
  },
};

export default function HomePage() {
  return (
    <div className="w-full">
      <HomeShopHero />
      <HomeCategoryGrid />
      <HomeBrandCarousel />
    </div>
  );
}

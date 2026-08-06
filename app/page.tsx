import type { Metadata } from "next";
import { HomeShopHero } from "@/components/storefront/home-shop-hero";
import { HomeCategoryGrid } from "@/components/storefront/home-category-grid";
import { HomeBrandCarousel } from "@/components/storefront/home-brand-carousel";
import { HowItWorks } from "@/components/storefront/how-it-works";

export const metadata: Metadata = {
  openGraph: {
    title: "Key Assist — Shop from Multiple Marketplaces",
    description:
      "Shop Amazon, Apple, Nike, GOAT, Zara, eBay, StockX and more — all from one place.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Key Assist — Shop from Multiple Marketplaces",
    description:
      "Shop Amazon, Apple, Nike, GOAT, Zara, eBay, StockX and more — all from one place.",
  },
};

export default function HomePage() {
  return (
    <div className="w-full">
      <HomeShopHero />
      <HowItWorks />
      <HomeCategoryGrid />
      <HomeBrandCarousel />
    </div>
  );
}

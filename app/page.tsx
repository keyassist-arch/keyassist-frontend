import type { Metadata } from "next";
import { HomeShopHero } from "@/components/storefront/home-shop-hero";
import { LogoStrip } from "@/components/storefront/logo-strip";
import { HowItWorks } from "@/components/storefront/how-it-works";
import { FeaturedProducts } from "@/components/storefront/featured-products";
import { LandingCategories } from "@/components/storefront/landing-categories";
import { WhyKeyAssist } from "@/components/storefront/why-key-assist";
import { Testimonials } from "@/components/storefront/testimonials";
import { LandingCtaBand } from "@/components/storefront/landing-cta-band";

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
      <LogoStrip />
      <HowItWorks />
      <FeaturedProducts />
      <LandingCategories />
      <WhyKeyAssist />
      <Testimonials />
      <LandingCtaBand />
    </div>
  );
}

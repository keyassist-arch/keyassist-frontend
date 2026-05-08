import { HomeShopHero } from "@/components/storefront/home-shop-hero";
import { HomeCategoryGrid } from "@/components/storefront/home-category-grid";
import { HomeBrandCarousel } from "@/components/storefront/home-brand-carousel";

export default function HomePage() {
  return (
    <div className="w-full">
      <HomeShopHero />
      <HomeCategoryGrid />
      <HomeBrandCarousel />
    </div>
  );
}

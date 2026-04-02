import { HeroBanner } from "@/components/storefront/hero-banner";
import { PromoBanners } from "@/components/storefront/promo-banners";
import { HomeCatalog } from "@/components/storefront/home-catalog";
import { PromoThree } from "@/components/storefront/promo-three";
import { HowItWorks } from "@/components/storefront/how-it-works";
import { Testimonials } from "@/components/storefront/testimonials";
import { BlogTeasers } from "@/components/storefront/blog-teasers";
import { Newsletter } from "@/components/storefront/newsletter";
import { FaqSection } from "@/components/marketing/faq-section";

export default function HomePage() {
  return (
    <div className="w-full">
      <HeroBanner />
      <PromoBanners />
      <HomeCatalog />
      <PromoThree />
      <HowItWorks />
      <Testimonials />
      <BlogTeasers />
      <Newsletter />
      <div className="mx-auto max-w-(--shop-layout-max) px-4 py-12 sm:px-8">
        <FaqSection />
      </div>
    </div>
  );
}

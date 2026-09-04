import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingProductCard, type LandingProduct } from "@/components/storefront/landing-product-card";

const PRODUCTS: LandingProduct[] = [
  {
    title: "Apple AirPods Pro (2nd Gen)",
    store: "Apple",
    rating: "4.8",
    ratingCount: "(1.2k)",
    price: "$249",
    comparePrice: "$279",
    imageBg: "#F2F2F4",
    imageUrl:
      "https://images.unsplash.com/photo-1638430079974-9816c63d7d60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    title: "Jordan 1 Retro High OG Chicago",
    store: "GOAT",
    rating: "5.0",
    ratingCount: "(87)",
    price: "$410",
    imageBg: "#E9F8EE",
    imageUrl:
      "https://images.unsplash.com/photo-1762331931510-d915e72a4f41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    title: "Oversized Wool Blend Overcoat",
    store: "Zara",
    rating: "4.6",
    ratingCount: "(340)",
    price: "$139",
    comparePrice: "$189",
    imageBg: "#F5F0E8",
    imageUrl:
      "https://images.unsplash.com/photo-1654409848415-9e0a9b0a9c8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
  {
    title: "Sony WH-1000XM5 Headphones",
    store: "Amazon",
    rating: "4.9",
    ratingCount: "(2.4k)",
    price: "$328",
    comparePrice: "$399",
    imageBg: "#FFF3E0",
    imageUrl:
      "https://images.unsplash.com/photo-1627989580309-bfaf3e58af6f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  },
];

export function FeaturedProducts() {
  return (
    <section className="w-full py-20" style={{ background: "var(--background)", borderTop: "1px solid var(--shop-border)" }}>
      <div className="mx-auto flex max-w-(--shop-layout-max) flex-col gap-8 px-4 sm:px-8 lg:px-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-[32px] font-extrabold tracking-[-0.6px] text-shop-ink">Featured right now</h2>
            <p className="text-[15px] text-shop-muted">Live listings from Amazon, Apple, Nike and more</p>
          </div>
          <Link
            href="/shop"
            className="flex items-center gap-1.5 rounded-full border border-shop-border bg-white px-[18px] py-2.5 text-sm font-semibold text-shop-ink transition hover:border-shop-accent/40"
          >
            View all products
            <ArrowRight className="h-[15px] w-[15px]" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((p) => (
            <LandingProductCard key={p.title} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

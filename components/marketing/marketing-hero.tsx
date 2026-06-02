import Link from "next/link";
import { SearchInput } from "@/components/product/search-input";
import { OpenCartTrigger } from "@/components/cart/open-cart-trigger";
import { siteContext } from "@/lib/site-context";

export function MarketingHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border p-8 md:p-12" style={{ background: "var(--shop-surface)", borderColor: "var(--shop-border)" }}>
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/[0.03] via-transparent to-transparent" />

      <div className="max-w-4xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/60">
          {siteContext.brand}
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Discover products across marketplaces.
          <span className="text-black/60"> Checkout in one flow.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-black/70">
          Paste marketplace URLs (Amazon, Apple, Nike, GOAT) and add items into a unified cart with delivery estimates
          and seller context when available.
        </p>

        <div className="mt-6">
          <SearchInput variant="hero" />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <OpenCartTrigger className="btn-primary">Go to cart</OpenCartTrigger>
          <Link href="/dashboard" className="btn-secondary">
            View dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}


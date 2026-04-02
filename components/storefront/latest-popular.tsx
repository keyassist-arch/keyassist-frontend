import Link from "next/link";
import type { Product } from "@/types";
import { productDetailPath } from "@/lib/product-detail-path";
import { formatApiMoney } from "@/lib/format-price";
import { OpenCartTrigger } from "@/components/cart/open-cart-trigger";

function MiniList({ title, items }: { title: string; items: Product[] }) {
  return (
    <div className="rounded-2xl border bg-white p-5" style={{ borderColor: "var(--shop-border)" }}>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((p) => (
          <li key={p.id} className="flex items-start justify-between gap-2 border-b border-black/5 pb-3 last:border-0 last:pb-0">
            <Link href={productDetailPath(p)} className="text-sm font-medium text-shop-ink hover:text-shop-accent">
              {p.title}
            </Link>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {formatApiMoney(p.price, p.currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LatestPopular({ products }: { products: Product[] }) {
  const latest = [...products].slice(-3).reverse();
  const popular = products.filter((p) => p.popular);

  return (
    <section id="collections" className="w-full scroll-mt-24 border-b bg-shop-surface py-10" style={{ borderColor: "var(--shop-border)" }}>
      <div className="mx-auto grid max-w-(--shop-layout-max) gap-6 px-4 lg:grid-cols-3 sm:px-8">
        <MiniList title="Latest picks" items={latest.length ? latest : products.slice(0, 3)} />
        <div
          className="flex flex-col justify-center rounded-2xl border p-8 text-white lg:min-h-[280px]"
          style={{ background: "var(--shop-promo-slate)", borderColor: "var(--shop-promo-slate)" }}
        >
          <h3 className="text-xl font-semibold">Commerce with clarity</h3>
          <p className="mt-3 text-sm text-white/80">
            Unified Commerce aggregates listings from major marketplaces so you can shop and track orders without juggling tabs.
          </p>
          <OpenCartTrigger className="mt-6 inline-flex w-fit bg-shop-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-shop-primary-hover">
            View cart
          </OpenCartTrigger>
        </div>
        <MiniList title="Popular now" items={popular.length ? popular.slice(0, 4) : products.slice(0, 4)} />
      </div>
    </section>
  );
}

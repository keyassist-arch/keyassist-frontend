"use client";

import Link from "next/link";
import { OpenCartTrigger } from "@/components/cart/open-cart-trigger";

const promos = [
  {
    title: "Paste a product link",
    body: "We normalize title, price, variants, and seller so you can compare before you buy.",
    href: "/shop",
    cta: "Try it",
  },
  {
    title: "Unified checkout",
    body: "One cart for items from different marketplaces. Order summary and confirmation in-app.",
    href: "/cart",
    cta: "Open cart",
  },
];

export function PromoBanners() {
  return (
    <section className="w-full border-b bg-white py-8" style={{ borderColor: "var(--shop-border)" }}>
      <div className="mx-auto grid max-w-(--shop-layout-max) gap-4 px-4 sm:grid-cols-2 sm:px-8">
        {promos.map((p) => (
          <div
            key={p.title}
            className="flex flex-col justify-between gap-4 rounded-2xl border bg-neutral-50 p-6 md:flex-row md:items-center"
            style={{ borderColor: "var(--shop-border)" }}
          >
            <div>
              <h2 className="text-lg font-semibold">{p.title}</h2>
              <p className="mt-2 max-w-md text-sm text-black/70">{p.body}</p>
            </div>
            {p.href === "/cart" ? (
              <OpenCartTrigger className="btn-primary shrink-0 self-start uppercase tracking-wide md:self-center">
                {p.cta}
              </OpenCartTrigger>
            ) : (
              <Link href={p.href} className="btn-primary shrink-0 self-start uppercase tracking-wide md:self-center">
                {p.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { siteContext } from "@/lib/site-context";

export function HeroBanner() {
  const slides = siteContext.hero.slides;
  const [index, setIndex] = useState(0);

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    const id = window.setInterval(() => go(1), 8000);
    return () => window.clearInterval(id);
  }, [go]);

  const slide = slides[index];

  return (
    <section className="w-full border-b bg-white pb-10 pt-8" style={{ borderColor: "var(--shop-border)" }}>
      <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
        <div
          className="relative overflow-hidden rounded-2xl bg-neutral-100 px-6 py-12 sm:px-10 sm:py-14 md:px-14 md:py-16 lg:px-16 lg:py-20"
          style={{ border: "1px solid var(--shop-border)" }}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-14 items-center justify-center sm:w-16">
            <button
              type="button"
              onClick={() => go(-1)}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-none border border-black/10 bg-white text-black/45 shadow-sm transition hover:text-black"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-14 items-center justify-center sm:w-16">
            <button
              type="button"
              onClick={() => go(1)}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-none border border-black/10 bg-white text-black/45 shadow-sm transition hover:text-black"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          </div>

          <div className="max-w-2xl pl-2 pr-14 sm:pl-4 sm:pr-16  md:pr-20 lg:pr-24">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black sm:text-xs">
              {siteContext.hero.promoTag}
            </p>
            <div key={index} className="hero-slide-enter">
              <h1 className="mt-4 text-3xl font-bold leading-[1.15] tracking-tight text-black sm:text-4xl md:text-5xl">
                {slide.title}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-600">
                {slide.body}
              </p>
            </div>
            <div className="mt-8">
              <Link
                href={siteContext.hero.ctaHref}
                className="inline-flex items-center justify-center rounded-none bg-black px-8 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-neutral-800 sm:text-sm"
              >
                {siteContext.hero.ctaLabel}
              </Link>
            </div>
            <p className="mt-5 max-w-md text-xs leading-relaxed text-neutral-500">
              Have a product link? Paste it into the search bar at the top of the page.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

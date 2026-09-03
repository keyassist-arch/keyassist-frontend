"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";

export function ProductDetailGallery({
  images,
  alt,
  storeLabel,
  discountLabel,
  className = "",
}: {
  images: string[];
  alt: string;
  storeLabel?: string;
  discountLabel?: string | null;
  className?: string;
}) {
  const list = images.length ? images : ["/product-placeholder.svg"];
  const [active, setActive] = useState(0);
  const main = list[Math.min(active, list.length - 1)];

  const prev = () => setActive((i) => Math.max(0, i - 1));
  const next = () => setActive((i) => Math.min(list.length - 1, i + 1));

  return (
    <div className={`flex w-full flex-col gap-3.5 ${className}`}>
      {/* Main image */}
      <div className="relative h-[380px] w-full overflow-hidden rounded-[22px] border border-shop-border bg-white sm:h-[460px] lg:h-[520px]">
        <Image
          src={main}
          alt={alt}
          fill
          className="object-contain p-6"
          sizes="(max-width: 1024px) 100vw, 55vw"
          unoptimized
          priority
        />

        {discountLabel ? (
          <span
            className="absolute left-5 top-5 rounded-full px-3 py-[7px] text-xs font-bold text-white"
            style={{ background: "var(--shop-sale)" }}
          >
            {discountLabel}
          </span>
        ) : null}

        {storeLabel ? (
          <span className="absolute bottom-5 left-5 flex items-center gap-[7px] rounded-full bg-white/95 px-3.5 py-2">
            <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: "var(--shop-primary)" }} aria-hidden />
            <span className="text-xs font-semibold text-shop-ink">Imported from {storeLabel}</span>
          </span>
        ) : null}

        <button
          type="button"
          className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-shop-muted transition hover:text-shop-ink"
          aria-label="Save"
        >
          <Heart className="h-[17px] w-[17px]" aria-hidden />
        </button>

        {active > 0 && (
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition hover:bg-white"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4 text-gray-700" />
          </button>
        )}
        {active < list.length - 1 && (
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition hover:bg-white"
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4 text-gray-700" />
          </button>
        )}
      </div>

      {/* Thumbnails */}
      {list.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {list.slice(0, 8).map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active ? "true" : undefined}
              className="relative h-24 w-full overflow-hidden rounded-[14px] border bg-white transition"
              style={{ borderColor: i === active ? "var(--shop-primary)" : "var(--shop-border)", borderWidth: i === active ? 2 : 1 }}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="140px" unoptimized />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

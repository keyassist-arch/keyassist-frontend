"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

export function ProductDetailGallery({
  images,
  alt,
  className = "",
}: {
  images: string[];
  alt: string;
  className?: string;
}) {
  const list = images.length ? images : ["/product-placeholder.svg"];
  const [active, setActive] = useState(0);
  const main = list[Math.min(active, list.length - 1)];

  const prev = () => setActive((i) => Math.max(0, i - 1));
  const next = () => setActive((i) => Math.min(list.length - 1, i + 1));

  return (
    <div className={`flex gap-3 ${className}`}>
      {/* Left thumbnail strip */}
      {list.length > 1 && (
        <div className="flex w-[60px] shrink-0 flex-col gap-2 overflow-y-auto">
          {list.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active ? "true" : undefined}
              className={`relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-xl border-2 bg-gray-50 transition ${
                i === active
                  ? "border-gray-900"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="60px" unoptimized />
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div className="relative min-w-0 max-h-[500px] flex-1 overflow-hidden rounded-2xl bg-gray-50">
        <div className="relative aspect-square w-full max-h-[500px]">
          <Image
            src={main}
            alt={alt}
            fill
            className="object-contain p-4 max-h-[500px]"
            sizes="(max-width: 1024px) 100vw, 55vw"
            unoptimized
            priority
          />
        </div>

        {/* Zoom */}
        <button
          type="button"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition hover:bg-white"
          aria-label="Zoom"
        >
          <ZoomIn className="h-4 w-4 text-gray-600" />
        </button>

        {/* Prev */}
        {active > 0 && (
          <button
            type="button"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition hover:bg-white"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4 text-gray-700" />
          </button>
        )}

        {/* Next */}
        {active < list.length - 1 && (
          <button
            type="button"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition hover:bg-white"
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4 text-gray-700" />
          </button>
        )}
      </div>
    </div>
  );
}

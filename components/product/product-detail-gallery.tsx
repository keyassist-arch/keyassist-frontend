"use client";

import Image from "next/image";
import { useState } from "react";

export function ProductDetailGallery({
  images,
  alt,
  className = "",
}: {
  images: string[];
  alt: string;
  className?: string;
}) {
  const list = images.length ? images : ["/file.svg"];
  const [active, setActive] = useState(0);
  const main = list[Math.min(active, list.length - 1)];

  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-start ${className}`}>
      {list.length > 1 ? (
        <ul
          className="flex flex-row gap-2 overflow-x-auto pb-1 sm:max-h-[min(70vh,640px)] sm:w-[4.5rem] sm:flex-shrink-0 sm:flex-col sm:overflow-y-auto sm:pb-0 sm:pr-1 sm:[-ms-overflow-style:none] sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden"
          role="list"
        >
          {list.map((src, i) => (
            <li key={`${src}-${i}`} className="flex-shrink-0">
              <button
                type="button"
                onClick={() => setActive(i)}
                className={`relative h-16 w-16 overflow-hidden border bg-white transition sm:h-[4.5rem] sm:w-[4.5rem] ${
                  i === active ? "border-shop-ink ring-1 ring-shop-ink" : "border-black/10 hover:border-black/30"
                }`}
                aria-label={`Image ${i + 1}`}
                aria-current={i === active ? "true" : undefined}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="72px" unoptimized />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        className="relative aspect-square w-full min-w-0 flex-1 overflow-hidden bg-shop-surface"
        style={{ border: "1px solid var(--shop-border)" }}
      >
        <Image
          src={main}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, min(960px, 55vw)"
          unoptimized
          priority
        />
      </div>
    </div>
  );
}

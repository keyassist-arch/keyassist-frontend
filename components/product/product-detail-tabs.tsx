"use client";

import { useState, type ReactNode } from "react";
import type { ProductDetailDescriptionBlock, ProductDetailZones } from "@/types/product-detail";
import { ProductHighlightList, ProductSpecTable } from "@/components/product/product-detail-zones";

type TabId = "description" | "specs";

export function ProductDetailTabs({
  descriptionBlocks,
  detailZones,
  specsExtra,
}: {
  descriptionBlocks?: ProductDetailDescriptionBlock[];
  detailZones?: ProductDetailZones;
  specsExtra?: ReactNode;
}) {
  const attrs = detailZones?.attributes?.filter((x) => x.key?.trim() && x.value?.trim()) ?? [];
  const highlights = detailZones?.highlights?.filter(Boolean) ?? [];
  const hasSpecs = Boolean(attrs.length || highlights.length || specsExtra);
  const [tab, setTab] = useState<TabId>("description");

  const tabs: { id: TabId; label: string }[] = [{ id: "description", label: "Description" }];
  if (hasSpecs) tabs.push({ id: "specs", label: "Specifications" });

  if (!descriptionBlocks?.length && !hasSpecs) return null;

  return (
    <div className="mt-14 border-t border-black/10 pt-10">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              tab === t.id ? "bg-shop-ink text-white" : "bg-black/5 text-shop-ink hover:bg-black/10"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        className="mt-4 rounded-2xl bg-white px-4 py-8 sm:px-8 sm:py-10"
        style={{ border: "1px solid var(--shop-border)" }}
      >
        {tab === "description" && descriptionBlocks?.length ? (
          <div className="space-y-8">
            {descriptionBlocks.map((block, i) => {
              const heading = block.title ?? (i === 0 ? "About this item" : "Details");
              return (
                <section key={i}>
                  <h2 className="text-lg font-semibold text-shop-ink">{heading}</h2>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed text-black/70 [&_a]:text-shop-accent [&_a]:underline">
                    {block.content}
                  </div>
                </section>
              );
            })}
          </div>
        ) : null}

        {tab === "specs" && hasSpecs ? (
          <div className="space-y-10">
            {specsExtra}
            <ProductHighlightList items={highlights} />
            <ProductSpecTable attributes={attrs} />
          </div>
        ) : null}

        {tab === "description" && !descriptionBlocks?.length && hasSpecs ? (
          <p className="text-sm text-black/60">No written description for this item. Check specifications.</p>
        ) : null}
      </div>
    </div>
  );
}

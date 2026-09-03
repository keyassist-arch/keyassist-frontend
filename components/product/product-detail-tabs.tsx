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
  const whatsInTheBox = detailZones?.whatsInTheBox?.filter(Boolean) ?? [];
  const hasSpecs = Boolean(attrs.length || highlights.length || whatsInTheBox.length || specsExtra);
  const [tab, setTab] = useState<TabId>("description");

  const tabs: { id: TabId; label: string }[] = [{ id: "description", label: "Description" }];
  if (hasSpecs) tabs.push({ id: "specs", label: "Specifications" });

  if (!descriptionBlocks?.length && !hasSpecs) return null;

  return (
    <div className="mt-10 border-t border-shop-border pt-10">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className="rounded-full px-[18px] py-2.5 text-sm font-semibold transition"
            style={
              tab === t.id
                ? { background: "var(--shop-ink)", color: "#FFFFFF" }
                : { background: "#FFFFFF", color: "var(--shop-muted)", border: "1px solid var(--shop-border)" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-7">
        {tab === "description" && descriptionBlocks?.length ? (
          <div className="max-w-3xl space-y-8">
            {descriptionBlocks.map((block, i) => {
              const heading = block.title ?? (i === 0 ? "Overview" : "Details");
              return (
                <section key={i}>
                  <h2 className="text-xl font-bold text-shop-ink">{heading}</h2>
                  <div className="mt-3 space-y-3 text-[15px] leading-[1.65] text-shop-muted [&_a]:text-shop-accent [&_a]:underline">
                    {block.content}
                  </div>
                </section>
              );
            })}
          </div>
        ) : null}

        {tab === "specs" && hasSpecs ? (
          <div className="flex flex-col gap-9 lg:flex-row lg:items-start lg:gap-14">
            <div className="flex w-full flex-col gap-9">
              {specsExtra}
              <ProductHighlightList items={highlights} />
            </div>
            <ProductSpecTable attributes={attrs} whatsInTheBox={whatsInTheBox} />
          </div>
        ) : null}

        {tab === "description" && !descriptionBlocks?.length && hasSpecs ? (
          <p className="text-sm text-shop-muted">No written description for this item. Check specifications.</p>
        ) : null}
      </div>
    </div>
  );
}

import { Fragment } from "react";
import { Check, Info } from "lucide-react";
import type { ProductAttribute, ProductDetailZones } from "@/types/product-detail";

function groupAttributes(attrs: ProductAttribute[]): Map<string, ProductAttribute[]> {
  const m = new Map<string, ProductAttribute[]>();
  for (const a of attrs) {
    const g = a.group?.trim() ?? "";
    if (!m.has(g)) m.set(g, []);
    m.get(g)!.push(a);
  }
  return m;
}

export function ProductHighlightList({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <section className="max-w-3xl" aria-labelledby="pdp-highlights-heading">
      <h2 id="pdp-highlights-heading" className="text-xl font-bold text-shop-ink">
        Highlights
      </h2>
      <ul className="mt-4 flex flex-col gap-2.5">
        {items.map((line, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm text-shop-ink">
            <Check className="h-4 w-4 shrink-0" style={{ color: "var(--shop-primary)" }} aria-hidden />
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProductSpecTable({
  attributes,
  whatsInTheBox,
}: {
  attributes: ProductAttribute[];
  whatsInTheBox?: string[];
}) {
  if (!attributes.length && !whatsInTheBox?.length) return null;
  const groups = groupAttributes(attributes);
  const entries = Array.from(groups.entries());

  return (
    <div
      className="flex w-full max-w-[420px] flex-col gap-4 rounded-[20px] border border-shop-border bg-white p-6"
      aria-labelledby="pdp-spec-heading"
    >
      <h2 id="pdp-spec-heading" className="text-base font-bold text-shop-ink">
        Specifications
      </h2>
      {entries.map(([groupName, rows], gi) => (
        <Fragment key={groupName || `specs-${gi}`}>
          {groupName ? <p className="text-xs font-semibold uppercase tracking-wide text-shop-muted">{groupName}</p> : null}
          {rows.map((row, i) => (
            <div
              key={`${row.key}-${i}`}
              className="flex items-center justify-between gap-4 border-b border-shop-border pb-3 last:border-b-0 last:pb-0"
            >
              <dt className="text-[13px] text-shop-muted">{row.key}</dt>
              <dd className="text-[13px] font-semibold text-shop-ink [&_a]:text-shop-accent [&_a]:underline">{row.value}</dd>
            </div>
          ))}
        </Fragment>
      ))}
      {whatsInTheBox?.length ? (
        <div className="flex flex-col gap-2 border-t border-shop-border pt-3.5">
          <p className="text-[13px] font-bold text-shop-ink">In the box</p>
          <p className="text-[13px] leading-[1.5] text-shop-muted">{whatsInTheBox.join(", ")}</p>
        </div>
      ) : null}
    </div>
  );
}

export function ProductComplianceCallout({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  return (
    <aside
      className="flex max-w-3xl flex-col gap-2.5 rounded-[14px] p-[18px]"
      style={{ background: "#FEF9EC", border: "1px solid #F5E4B8" }}
      aria-labelledby="pdp-compliance-heading"
    >
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 shrink-0" style={{ color: "#B7791F" }} aria-hidden />
        <h2 id="pdp-compliance-heading" className="text-sm font-bold" style={{ color: "#8A6314" }}>
          Important information
        </h2>
      </div>
      <ul className="flex flex-col gap-1.5">
        {lines.map((line, i) => (
          <li key={i} className="text-[13px] leading-[1.55]" style={{ color: "#8A6314" }}>
            {line}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function ProductWhatsInTheBox({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  return (
    <section className="max-w-3xl" aria-labelledby="pdp-inbox-heading">
      <h2 id="pdp-inbox-heading" className="text-xl font-bold text-shop-ink">
        In the box
      </h2>
      <ul className="mt-4 flex flex-col gap-2.5">
        {lines.map((line, i) => (
          <li key={i} className="text-sm text-shop-ink">
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Highlights + grouped specs; omit wrapper when empty. */
export function ProductDetailZonesAboveStory({ zones }: { zones?: ProductDetailZones }) {
  if (!zones) return null;
  const h = zones.highlights?.filter(Boolean) ?? [];
  const a = zones.attributes?.filter((x) => x.key?.trim() && x.value?.trim()) ?? [];
  if (!h.length && !a.length) return null;
  return (
    <div className="mt-16 space-y-12 border-t border-shop-border pt-16">
      <ProductHighlightList items={h} />
      <ProductSpecTable attributes={a} />
    </div>
  );
}

/** Compliance + in-box; placed after long-form description blocks. */
export function ProductDetailZonesBelowStory({ zones }: { zones?: ProductDetailZones }) {
  if (!zones) return null;
  const c = zones.compliance?.filter(Boolean) ?? [];
  if (!c.length) return null;
  return (
    <div className="mt-10 border-t border-shop-border pt-10">
      <ProductComplianceCallout lines={c} />
    </div>
  );
}

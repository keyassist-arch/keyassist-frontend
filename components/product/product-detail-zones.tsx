import { Fragment } from "react";
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
      <h2 id="pdp-highlights-heading" className="text-xl font-semibold text-shop-ink">
        Highlights
      </h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-shop-muted marker:text-shop-ink/40">
        {items.map((line, i) => (
          <li key={i} className="text-shop-ink">
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProductSpecTable({ attributes }: { attributes: ProductAttribute[] }) {
  if (!attributes.length) return null;
  const groups = groupAttributes(attributes);
  const entries = Array.from(groups.entries());

  return (
    <div className="max-w-3xl space-y-10">
      {entries.map(([groupName, rows], gi) => {
        const headingId = `pdp-spec-${gi}`;
        return (
        <section key={groupName || `specs-${gi}`} aria-labelledby={headingId}>
          <h2 id={headingId} className="text-xl font-semibold text-shop-ink">
            {groupName || "Specifications"}
          </h2>
          <dl className="mt-4 grid grid-cols-1 gap-x-10 gap-y-3 text-sm sm:grid-cols-[minmax(8rem,12rem)_1fr]">
            {rows.map((row, i) => (
              <Fragment key={`${row.key}-${i}`}>
                <dt className="text-shop-muted">{row.key}</dt>
                <dd className="text-shop-ink [&_a]:text-shop-accent [&_a]:underline">{row.value}</dd>
              </Fragment>
            ))}
          </dl>
        </section>
        );
      })}
    </div>
  );
}

export function ProductComplianceCallout({ lines }: { lines: string[] }) {
  if (!lines.length) return null;
  return (
    <aside
      className="max-w-3xl border-l-4 border-amber-600/70 bg-amber-50/60 py-4 pl-4 pr-4"
      aria-labelledby="pdp-compliance-heading"
    >
      <h2 id="pdp-compliance-heading" className="text-sm font-semibold text-shop-ink">
        Important information
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-shop-muted">
        {lines.map((line, i) => (
          <li key={i} className="text-shop-ink/90">
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
      <h2 id="pdp-inbox-heading" className="text-xl font-semibold text-shop-ink">
        In the box
      </h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-shop-muted marker:text-shop-ink/40">
        {lines.map((line, i) => (
          <li key={i} className="text-shop-ink">
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
    <div className="mt-16 space-y-12 border-t border-black/10 pt-16">
      <ProductHighlightList items={h} />
      <ProductSpecTable attributes={a} />
    </div>
  );
}

/** Compliance + in-box; placed after long-form description blocks. */
export function ProductDetailZonesBelowStory({ zones }: { zones?: ProductDetailZones }) {
  if (!zones) return null;
  const c = zones.compliance?.filter(Boolean) ?? [];
  const w = zones.whatsInTheBox?.filter(Boolean) ?? [];
  if (!c.length && !w.length) return null;
  return (
    <div className="mt-12 space-y-10 border-t border-black/10 pt-12">
      <ProductComplianceCallout lines={c} />
      <ProductWhatsInTheBox lines={w} />
    </div>
  );
}

import Link from "next/link";

const blocks = [
  {
    title: "Delivery estimates",
    body: "See expected timelines when seller data is available.",
    href: "/faq",
    bg: "var(--shop-promo-peach)",
    text: "var(--shop-ink)",
    linkClass: "text-shop-ink hover:underline",
  },
  {
    title: "Order tracking",
    body: "Follow status updates from pending through delivered.",
    href: "/dashboard",
    bg: "var(--shop-promo-sage)",
    text: "#ffffff",
    linkClass: "text-white/95 underline decoration-white/50 hover:decoration-white",
  },
  {
    title: "Seller context",
    body: "Know which marketplace and seller each line item comes from.",
    href: "/contact",
    bg: "var(--shop-promo-tan)",
    text: "var(--shop-ink)",
    linkClass: "text-shop-ink hover:underline",
  },
] as const;

export function PromoThree() {
  return (
    <section className="w-full border-b bg-shop-surface py-10" style={{ borderColor: "var(--shop-border)" }}>
      <div className="mx-auto grid max-w-[var(--shop-layout-max)] gap-4 px-4 md:grid-cols-3 sm:px-8">
        {blocks.map((b) => (
          <div
            key={b.title}
            className="rounded-2xl border p-6"
            style={{ borderColor: "var(--shop-border)", background: b.bg, color: b.text }}
          >
            <h3 className="font-semibold">{b.title}</h3>
            <p className="mt-2 text-sm opacity-90" style={{ color: b.text === "#ffffff" ? "rgba(255,255,255,0.88)" : "var(--shop-muted)" }}>
              {b.body}
            </p>
            <Link href={b.href} className={`mt-4 inline-block text-sm font-medium ${b.linkClass}`}>
              Learn more
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

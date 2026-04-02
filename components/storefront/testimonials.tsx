import { Star } from "lucide-react";

const quotes = [
  {
    name: "Jordan M.",
    role: "Repeat buyer",
    text: "Pasting Amazon and Nike links into one cart actually worked. Tracking in the dashboard is straightforward.",
    rating: 5,
  },
  {
    name: "Samira K.",
    role: "Small business",
    text: "We use the admin view to update order status after we confirm with suppliers. Fits our manual workflow.",
    rating: 5,
  },
  {
    name: "Chris L.",
    role: "First-time user",
    text: "Clear prices and variants before checkout. No surprise seller names buried in fine print.",
    rating: 5,
  },
] as const;

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5 shrink-0"
          strokeWidth={1.5}
          aria-hidden
          style={{
            fill: i < count ? "var(--shop-star)" : "transparent",
            color: i < count ? "var(--shop-star)" : "var(--shop-border)",
          }}
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section
      className="w-full border-b bg-shop-surface py-12 sm:py-14"
      style={{ borderColor: "var(--shop-border)" }}
    >
      <div className="mx-auto max-w-[var(--shop-layout-max)] px-4 sm:px-8">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-shop-muted">Testimonials</p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-shop-ink sm:text-2xl">What buyers say</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-black/65">
          Short notes from shoppers and sellers who use one cart across marketplaces — not paid endorsements.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quotes.map((q) => (
            <article
              key={q.name}
              className="flex h-full flex-col rounded-2xl border bg-white p-6 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
              style={{ borderColor: "var(--shop-border)" }}
            >
              <StarRow count={q.rating} />
              <blockquote className="mt-4 flex-1 border-l-2 pl-4 text-left" style={{ borderColor: "var(--shop-accent)" }}>
                <p className="text-sm leading-relaxed text-black/85">&ldquo;{q.text}&rdquo;</p>
              </blockquote>
              <footer className="mt-6 flex items-center gap-3 border-t pt-5" style={{ borderColor: "var(--shop-border)" }}>
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold text-shop-accent"
                  style={{ borderColor: "var(--shop-border)", background: "var(--shop-accent-soft)" }}
                  aria-hidden
                >
                  {q.name.charAt(0)}
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-semibold text-shop-ink">{q.name}</p>
                  <p className="text-xs text-black/50">{q.role}</p>
                </div>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

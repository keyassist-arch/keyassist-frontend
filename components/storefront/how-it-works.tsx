import { siteContext } from "@/lib/site-context";

export function HowItWorks() {
  return (
    <section id="how" className="w-full scroll-mt-24 border-b bg-white py-10" style={{ borderColor: "var(--shop-border)" }}>
      <div className="mx-auto max-w-[var(--shop-layout-max)] px-4 sm:px-8">
        <h2 className="text-xl font-semibold">How {siteContext.brand} works</h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            "Paste or search for a product URL from a supported marketplace.",
            "Review images, variants, price, and delivery estimate on the product page.",
            "Add to cart, check out once, then track the order from your dashboard.",
          ].map((step, i) => (
            <li key={step} className="flex gap-4 rounded-2xl border p-5" style={{ borderColor: "var(--shop-border)" }}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-shop-primary text-sm font-bold text-white">
                {i + 1}
              </span>
              <p className="text-sm text-black/80">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

import { siteContext } from "@/lib/site-context";

const STEPS = [
  {
    title: "Get Your Quote",
    description:
      "Paste a link to any US store (GOAT, StockX, Nike, Amazon, Sephora, etc.) or describe the product you want to buy. Our system calculates your transparent, all-in quote.",
  },
  {
    title: "Pay Securely in USD",
    description:
      "Approve your quote and pay via online checkout using card, Stripe, or PayPal. Your quote covers full US procurement, concierge handling, and initial logistics.",
  },
  {
    title: "US Procurement & Inspection",
    description:
      "Our team purchases your item, receives it at our Fort Worth/Dallas hub, verifies authenticity, inspects product condition, and prepares all export documentation.",
  },
  {
    title: "Express Air Freight & Delivery",
    description:
      "Your package is dispatched via air freight to Nigeria. Receive live tracking updates from takeoff all the way to doorstep delivery or local pickup in Lagos.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="w-full scroll-mt-24 border-b bg-white py-10" style={{ borderColor: "var(--shop-border)" }}>
      <div className="mx-auto max-w-[var(--shop-layout-max)] px-4 sm:px-8">
        <h2 className="text-xl font-semibold">How {siteContext.brand} works</h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4 rounded-2xl border p-5" style={{ borderColor: "var(--shop-border)" }}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-shop-primary text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-shop-ink">{step.title}</p>
                <p className="mt-1 text-sm text-black/70">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

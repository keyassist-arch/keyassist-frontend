import { Accordion } from "@/components/ui/accordion";

export function FaqSection() {
  return (
    <section className="shop-dark-section rounded-3xl p-8 md:p-12">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Frequently asked questions
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-white/70">
        Everything you need to know about pricing, shipping, and how Key Assist gets your items from US marketplaces to your door.
      </p>

      <div className="mt-6">
        <Accordion
          tone="dark"
          items={[
            {
              question: "How much is the Key Assist service fee?",
              answer: "10–15% of the total value of your cart.",
            },
            {
              question: "How long is delivery within Lagos?",
              answer:
                "$6 per lb (2.72 kg), with an estimated delivery time of 0–12 days.",
            },
            {
              question: "How long is delivery outside Lagos?",
              answer:
                "$7 per lb (3.18 kg), with an estimated delivery time of 0–15 days.",
            },
            {
              question: "Is there insurance for lost items?",
              answer:
                "Yes. Key Assist offers optional 5% and 3% insurance tiers that secure your items to Nigeria if opted in, providing full coverage of the declared item value.",
            },
            {
              question: "Is there customs or additional charges when items arrive in Nigeria?",
              answer:
                "No. Lagos pickup is free. Additional charges apply only if you choose to ship outside Lagos.",
            },
            {
              question: "What are the prohibited items?",
              answer: "Dangerous items, liquids, batteries, and similar restricted goods.",
            },
            {
              question: "Why Key Assist?",
              answer:
                "We understand international shipping, and our goal is to bridge as many gaps as possible for you.",
            },
            {
              question: "How is my total order price calculated?",
              answer:
                "Your total quote has two transparent components: (1) Item Procurement & Sourcing — the exact landed cost to purchase your item from the US merchant and deliver it to our Texas hub, including list price, seller domestic shipping, and merchant checkout fees; and (2) the Key Assist Concierge Fee — our flat or percentage-based operational fee covering physical intake, authenticity verification, USD currency processing, and export handling.",
            },
            {
              question: "Want to save on items and shipping?",
              answer: "Email us at contact@keyassistco.com for assistance.",
            },
          ]}
        />
      </div>
    </section>
  );
}


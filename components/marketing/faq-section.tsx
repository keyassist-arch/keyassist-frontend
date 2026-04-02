import { Accordion } from "@/components/ui/accordion";

export function FaqSection() {
  return (
    <section className="shop-dark-section rounded-3xl p-8 md:p-12">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Frequently asked questions
      </h2>
      <p className="mt-3 max-w-2xl text-sm text-white/70">
        Everything you need to understand how unified discovery, cart, and checkout work across marketplaces.
      </p>

      <div className="mt-6">
        <Accordion
          tone="dark"
          items={[
            {
              question: "How do I add a product from another marketplace?",
              answer:
                "Paste the product URL into the homepage search, open the matched product detail page, select a variant, then add it to the unified cart.",
            },
            {
              question: "Can I checkout products from multiple sellers at once?",
              answer:
                "Yes. Items from multiple marketplaces are consolidated into a single unified cart and checkout flow with a shared order summary.",
            },
            {
              question: "Do I get delivery estimates and seller info?",
              answer:
                "When we have them from the retailer, product and checkout pages show delivery estimates and seller details.",
            },
            {
              question: "How does admin order processing work?",
              answer:
                "Staff can view every order, update fulfillment and shipping status, and keep catalog data in sync with marketplace listings. Access is limited to approved team accounts.",
            },
          ]}
        />
      </div>
    </section>
  );
}


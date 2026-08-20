"use client";

import { Link2, CreditCard, PackageCheck, Plane } from "lucide-react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { siteContext } from "@/lib/site-context";

const STEPS = [
  {
    icon: Link2,
    title: "Get Your Quote",
    description:
      "Paste a link to any US store (GOAT, StockX, Nike, Amazon, Sephora, etc.) or describe the product you want to buy. Our system calculates your transparent, all-in quote.",
  },
  {
    icon: CreditCard,
    title: "Pay Securely in USD",
    description:
      "Approve your quote and pay via online checkout using card, Stripe, or PayPal. Your quote covers full US procurement, concierge handling, and initial logistics.",
  },
  {
    icon: PackageCheck,
    title: "US Procurement & Inspection",
    description:
      "Our team purchases your item, receives it at our Fort Worth/Dallas hub, verifies authenticity, inspects product condition, and prepares all export documentation.",
  },
  {
    icon: Plane,
    title: "Express Air Freight & Delivery",
    description:
      "Your package is dispatched via air freight to Nigeria. Receive live tracking updates from takeoff all the way to doorstep delivery or local pickup in Lagos.",
  },
];

const headerVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } },
};

export function HowItWorks() {
  const prefersReducedMotion = useReducedMotion();

  const stepVariants: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } },
  };

  const lineVariants: Variants = {
    hidden: { scaleX: 0 },
    show: { scaleX: 1, transition: { duration: 0.9, ease: [0.32, 0.72, 0, 1] } },
  };

  return (
    <section
      id="how"
      className="w-full scroll-mt-24 border-b bg-white py-16 sm:py-20"
      style={{ borderColor: "var(--shop-border)" }}
    >
      <div className="mx-auto max-w-[var(--shop-layout-max)] px-4 sm:px-8">
        <motion.div
          className="max-w-xl"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={headerVariants}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-shop-accent">
            The journey
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-shop-ink sm:text-3xl">
            How {siteContext.brand} works
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-shop-muted">
            From a pasted link to your door in Lagos — four steps, fully tracked.
          </p>
        </motion.div>

        <ol className="relative mt-14 flex flex-col gap-10 md:mt-16 md:grid md:grid-cols-4 md:gap-8">
          {/* Route line — desktop only, connects icon centers across the row */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute top-8 hidden h-px origin-left md:block"
            style={{
              left: "12.5%",
              right: "12.5%",
              background:
                "linear-gradient(90deg, var(--shop-primary) 0%, var(--shop-accent-2) 100%)",
            }}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={lineVariants}
          />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isLast = i === STEPS.length - 1;
            return (
              <motion.li
                key={step.title}
                className="relative flex gap-4 md:flex-col md:items-center md:gap-0 md:text-center"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-80px" }}
                variants={stepVariants}
                transition={{ delay: prefersReducedMotion ? 0 : i * 0.1 }}
              >
                {/* Icon node + mobile rail connector */}
                <div className="relative flex shrink-0 flex-col items-center">
                  <span
                    className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full ring-4 ring-white"
                    style={{ background: "var(--shop-accent-soft)" }}
                  >
                    <Icon size={26} className="text-shop-primary" aria-hidden />
                    <span
                      className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white text-[11px] font-bold text-white"
                      style={{ background: "var(--shop-primary)" }}
                    >
                      {i + 1}
                    </span>
                  </span>
                  {!isLast && (
                    <span
                      aria-hidden
                      className="mt-1 w-px flex-1 md:hidden"
                      style={{ background: "var(--shop-border)", minHeight: "2.25rem" }}
                    />
                  )}
                </div>

                <div className="pb-1 md:mt-6 md:px-2">
                  <p className="text-base font-semibold text-shop-ink">{step.title}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-shop-muted">
                    {step.description}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

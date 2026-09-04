import { BadgeCheck, Headset, Radar, ReceiptText, type LucideIcon } from "lucide-react";

const FEATURES: { Icon: LucideIcon; title: string; body: string; dark: boolean }[] = [
  {
    Icon: BadgeCheck,
    title: "100% authenticity checks",
    body: "Every item is inspected and verified at our Dallas hub before it ships. No fakes, no swaps — or your money back.",
    dark: true,
  },
  {
    Icon: ReceiptText,
    title: "One transparent all-in price",
    body: "Item cost, procurement, freight and duties in a single quote. What you approve is exactly what you pay.",
    dark: false,
  },
  {
    Icon: Radar,
    title: "Live tracking, end to end",
    body: "Follow your order from US purchase to Lagos doorstep with real-time status at every leg of the journey.",
    dark: false,
  },
  {
    Icon: Headset,
    title: "Human concierge support",
    body: "A real team handles sourcing, questions and edge cases — reachable on WhatsApp whenever you need them.",
    dark: true,
  },
];

const METRICS = [
  { value: "12+", label: "US marketplaces" },
  { value: "7–12 days", label: "Avg. delivery to Lagos" },
  { value: "100%", label: "Authenticity guarantee" },
  { value: "4.9/5", label: "Customer rating" },
];

function FeatureCard({ Icon, title, body, dark }: { Icon: LucideIcon; title: string; body: string; dark: boolean }) {
  return (
    <article
      className="flex flex-col gap-3.5 rounded-[20px] border p-7"
      style={{
        background: dark ? "var(--shop-dark)" : "#FFFFFF",
        borderColor: dark ? "#3A3532" : "var(--shop-border)",
      }}
    >
      <span
        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px]"
        style={{ background: dark ? "#2B4A3E" : "var(--shop-accent-soft)" }}
      >
        <Icon className="h-[22px] w-[22px]" style={{ color: dark ? "#34D399" : "var(--shop-primary)" }} aria-hidden />
      </span>
      <p className="text-[19px] font-bold" style={{ color: dark ? "#FFFFFF" : "var(--shop-ink)" }}>
        {title}
      </p>
      <p className="text-sm leading-[1.55]" style={{ color: dark ? "#B8B2AC" : "var(--shop-muted)" }}>
        {body}
      </p>
    </article>
  );
}

export function WhyKeyAssist() {
  return (
    <section className="w-full py-20" style={{ background: "var(--background)", borderTop: "1px solid var(--shop-border)" }}>
      <div className="mx-auto flex max-w-(--shop-layout-max) flex-col gap-11 px-4 sm:px-8 lg:px-24">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <p className="text-xs font-bold tracking-[1.5px]" style={{ color: "var(--shop-primary)" }}>
            WHY KEY ASSIST
          </p>
          <h2 className="text-[32px] font-extrabold tracking-[-0.8px] text-shop-ink sm:text-[40px]">
            Built for buying abroad, without the headache
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <FeatureCard {...FEATURES[0]} />
            <FeatureCard {...FEATURES[1]} />
          </div>
          <div className="flex flex-col gap-5">
            <FeatureCard {...FEATURES[2]} />
            <FeatureCard {...FEATURES[3]} />
          </div>
        </div>

        <div className="grid grid-cols-2 rounded-[20px] border border-shop-border bg-white py-7 sm:grid-cols-4">
          {METRICS.map((m, i) => (
            <div
              key={m.label}
              className="flex flex-col items-center gap-1.5 px-4 text-center"
              style={i < METRICS.length - 1 ? { borderRight: "1px solid var(--shop-border)" } : undefined}
            >
              <span className="text-[30px] font-extrabold" style={{ color: "var(--shop-primary)" }}>
                {m.value}
              </span>
              <span className="text-[13px] text-shop-muted">{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

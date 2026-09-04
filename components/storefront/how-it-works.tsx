import { CreditCard, FileText, PackageCheck, Plane, type LucideIcon } from "lucide-react";

const STEPS: { num: string; title: string; desc: string; Icon: LucideIcon }[] = [
  {
    num: "1",
    title: "Get your quote",
    desc: "Paste a link to any US store or describe the product. We calculate a transparent, all-in quote instantly.",
    Icon: FileText,
  },
  {
    num: "2",
    title: "Pay securely in USD",
    desc: "Approve and pay by card, Stripe or PayPal. Your quote covers procurement, handling and logistics.",
    Icon: CreditCard,
  },
  {
    num: "3",
    title: "US procurement & checks",
    desc: "We buy it, receive it at our Dallas hub, verify authenticity and inspect condition before export.",
    Icon: PackageCheck,
  },
  {
    num: "4",
    title: "Air freight & delivery",
    desc: "Your package flies to Nigeria with live tracking — to your door or local pickup in Lagos.",
    Icon: Plane,
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="w-full scroll-mt-20 bg-white py-20 sm:py-[80px]">
      <div className="mx-auto flex max-w-(--shop-layout-max) flex-col gap-11 px-4 sm:px-8 lg:px-24">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <p className="text-xs font-bold tracking-[1.5px]" style={{ color: "var(--shop-primary)" }}>
            HOW IT WORKS
          </p>
          <h2 className="text-[32px] font-extrabold tracking-[-0.8px] text-shop-ink sm:text-[40px]">
            From US checkout to your Lagos doorstep
          </h2>
          <p className="max-w-[600px] text-base leading-[1.55] text-shop-muted">
            Four simple steps. One transparent price. No surprises at customs, no juggling forwarders.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ num, title, desc, Icon }) => (
            <article
              key={num}
              className="flex flex-col gap-4 rounded-[20px] border border-shop-border p-6"
              style={{ background: "var(--background)" }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px]"
                  style={{ background: "var(--shop-primary)" }}
                >
                  <Icon className="h-[22px] w-[22px] text-white" aria-hidden />
                </span>
                <span className="text-[34px] font-extrabold" style={{ color: "var(--shop-border)" }}>
                  {num}
                </span>
              </div>
              <p className="text-[17px] font-bold text-shop-ink">{title}</p>
              <p className="text-sm leading-[1.5] text-shop-muted">{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

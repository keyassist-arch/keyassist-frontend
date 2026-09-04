import Link from "next/link";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";

export function LandingCtaBand() {
  return (
    <section className="w-full px-4 py-16 sm:px-8 sm:py-24 lg:px-24">
      <div className="mx-auto max-w-(--shop-layout-max)">
        <div
          className="relative flex flex-col items-center overflow-hidden rounded-[28px] px-6 py-16 text-center sm:px-10"
          style={{ background: "var(--shop-dark)" }}
        >
          <div
            className="pointer-events-none absolute -right-0 -top-[120px] h-[400px] w-[448px] rounded-full"
            style={{ background: "radial-gradient(circle, #10B98159 0%, #1C191700 100%)" }}
            aria-hidden
          />

          <span
            className="relative z-10 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
            style={{ background: "#2B4A3E", color: "#34D399" }}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Flat 10% off your first order
          </span>

          <h2 className="relative z-10 mt-6 max-w-[760px] text-[32px] font-extrabold leading-[1.1] tracking-[-1px] text-white sm:text-[46px]">
            Paste a link. We&apos;ll handle the rest.
          </h2>

          <p className="relative z-10 mt-4 max-w-[560px] text-base leading-[1.55] sm:text-[17px]" style={{ color: "#C9C3BD" }}>
            Start your first order in under a minute. No account needed to get a transparent, all-in quote.
          </p>

          <div className="relative z-10 mt-7 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full px-7 py-[15px] text-[15px] font-bold text-white transition hover:opacity-90"
              style={{ background: "var(--shop-primary)" }}
            >
              Start shopping
              <ArrowRight className="h-[17px] w-[17px]" aria-hidden />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full px-7 py-[15px] text-[15px] font-semibold text-white transition hover:opacity-90"
              style={{ background: "#2A2523", border: "1px solid #3A3532" }}
            >
              <MessageCircle className="h-[17px] w-[17px]" aria-hidden />
              Chat on WhatsApp
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

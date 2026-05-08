import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { siteContext } from "@/lib/site-context";
import { ShopImportFromUrl } from "@/components/storefront/shop-import-from-url";

type Tag = { label: string; bg: string; text: string; rotate: string; big?: boolean };

const tags: Tag[] = [
  { label: "Amazon",          bg: "#FFF0DC", text: "#B45200", rotate: "-2deg",   big: true  },
  { label: "Apple",           bg: "#DCEEFF", text: "#0055B3", rotate: "1.5deg"             },
  { label: "Nike",            bg: "#1A1A1A", text: "#F0F0F0", rotate: "-1deg"              },
  { label: "Jumia",           bg: "#FFF3CC", text: "#9A4E00", rotate: "2.5deg"             },
  { label: "Walmart",         bg: "#DCF0FF", text: "#005FA0", rotate: "-1.5deg"            },
  { label: "eBay",            bg: "#FFE0EB", text: "#980038", rotate: "1deg"               },
  { label: "Paste a link",    bg: "#FEFCCD", text: "#6B5300", rotate: "-2deg",   big: true  },
  { label: "One cart",        bg: "#EDE0FF", text: "#5B00CC", rotate: "2.5deg",  big: true  },
  { label: "Compare prices",  bg: "#D6FFE4", text: "#0A6528", rotate: "-1.5deg"            },
  { label: "Secure checkout", bg: "#FFE0DF", text: "#A00000", rotate: "1.5deg"             },
  { label: "Track orders",    bg: "#D0FFF2", text: "#005A42", rotate: "-2.5deg"            },
  { label: "10+ stores",      bg: "#FFDFF5", text: "#880060", rotate: "1deg"               },
];

export function HeroBanner() {
  return (
    <section className="w-full border-b" style={{ borderColor: "var(--shop-border)" }}>
      <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
        <div className="relative py-14 lg:py-18">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] rounded-[32px]"
            style={{
              background:
                "radial-gradient(800px 260px at 50% 0%, color-mix(in srgb, var(--shop-accent) 18%, transparent), transparent), radial-gradient(700px 240px at 80% 20%, rgba(52,211,153,0.20), transparent)",
            }}
            aria-hidden
          />

          <div className="mx-auto max-w-4xl text-center">

            {/* Copy */}
            <div className="hero-slide-enter">
            <span
              className="inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest"
              style={{ background: "#FFF0DC", color: "#B45200" }}
            >
              {siteContext.hero.promoTag}
            </span>

            <h1 className="mt-5 text-4xl font-bold leading-[1.15] tracking-tight text-stone-900 sm:text-5xl lg:text-[3.5rem]">
              One cart.{" "}
              <mark
                className="not-italic"
                style={{
                  background: "#FDE68A",
                  color: "#78350F",
                  padding: "2px 10px 5px",
                  borderRadius: "6px",
                }}
              >
                Many marketplaces.
              </mark>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-stone-500">
              {siteContext.hero.slides[0].body}
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 border border-stone-200 px-7 py-3.5 text-sm font-semibold text-stone-600 transition hover:border-stone-400 hover:text-stone-900"
              >
                Browse the shop
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            <div className="mx-auto mt-7 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-start gap-3 rounded-2xl border bg-stone-50 px-4 py-3" style={{ borderColor: "var(--shop-border)" }}>
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#5C4AE6]/10 text-[#5C4AE6]">
                  <Sparkles className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-shop-ink">Fast import</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-shop-muted">Paste a link. We fetch details automatically.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-stone-50 px-4 py-3" style={{ borderColor: "var(--shop-border)" }}>
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#5C4AE6]/10 text-[#5C4AE6]">
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-shop-ink">Secure checkout</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-shop-muted">Clear totals and fewer surprises at checkout.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-stone-50 px-4 py-3" style={{ borderColor: "var(--shop-border)" }}>
                <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#5C4AE6]/10 text-[#5C4AE6]">
                  <Truck className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-shop-ink">Track orders</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-shop-muted">Keep everything in one place, regardless of store.</p>
                </div>
              </div>
            </div>

              <div className="mx-auto mt-9 max-w-2xl text-left">
                <ShopImportFromUrl />
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {tags.slice(0, 10).map((tag) => (
                    <span
                      key={tag.label}
                      className={`inline-block rounded-full font-semibold ${
                        tag.big ? "px-4 py-2 text-xs" : "px-3 py-1.5 text-[11px]"
                      }`}
                      style={{
                        background: tag.bg,
                        color: tag.text,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      }}
                    >
                      {tag.label}
                    </span>
                  ))}
                  <span className="ml-1 text-[11px] font-medium text-black/50">…and more</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

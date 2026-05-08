import Link from "next/link";
import { Link2, ShoppingCart, PackageSearch } from "lucide-react";

const PLATFORMS = [
  { label: "Amazon",  bg: "#FFF0DC", text: "#B45200" },
  { label: "Apple",   bg: "#DCEEFF", text: "#0055B3" },
  { label: "Nike",    bg: "#1A1A1A", text: "#F0F0F0" },
  { label: "Jumia",   bg: "#FFF3CC", text: "#9A4E00" },
  { label: "Walmart", bg: "#DCF0FF", text: "#005FA0" },
  { label: "eBay",    bg: "#FFE0EB", text: "#980038" },
  { label: "Etsy",    bg: "#FFE8D6", text: "#9C3F00" },
  { label: "Target",  bg: "#FFE0E0", text: "#AE0000" },
];

const FEATURES = [
  {
    icon: Link2,
    iconBg: "#EDE0FF",
    iconColor: "#5B00CC",
    title: "Paste any product URL",
    body: "Drop a link from Amazon, Nike, Apple or Jumia — we pull the title, price, variants and images automatically.",
    href: "/shop",
    cta: "Try it now",
    ctaBg: "#EDE0FF",
    ctaColor: "#5B00CC",
  },
  {
    icon: ShoppingCart,
    iconBg: "#D6FFE4",
    iconColor: "#0A6528",
    title: "One cart, many stores",
    body: "Mix items from different marketplaces. One checkout flow, one order summary — no juggling tabs.",
    href: "/cart",
    cta: "View cart",
    ctaBg: "#D6FFE4",
    ctaColor: "#0A6528",
  },
  {
    icon: PackageSearch,
    iconBg: "#DCEEFF",
    iconColor: "#0055B3",
    title: "Track every order",
    body: "All your orders — regardless of which marketplace they shipped from — live in one dashboard.",
    href: "/dashboard",
    cta: "Go to dashboard",
    ctaBg: "#DCEEFF",
    ctaColor: "#0055B3",
  },
];

export function PromoBanners() {
  return (
    <div className="w-full border-b" style={{ borderColor: "var(--shop-border)" }}>

      {/* ── Supported platforms strip ── */}
      <div className="w-full border-b py-4" style={{ borderColor: "var(--shop-border)", background: "#fafaf9" }}>
        <div className="mx-auto max-w-[var(--shop-layout-max)] px-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-widest text-shop-muted">
              Shop on:
            </span>
            {PLATFORMS.map((p) => (
              <Link
                key={p.label}
                href={`/shop?q=${encodeURIComponent(p.label.toLowerCase())}`}
                className="inline-flex items-center rounded-full px-4 py-1 text-xs font-bold transition hover:scale-105 hover:shadow-md"
                style={{ background: p.bg, color: p.text }}
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Feature highlights ── */}
      <div className="w-full bg-white py-10">
        <div className="mx-auto max-w-[var(--shop-layout-max)] px-4 sm:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="flex flex-col gap-4 rounded-2xl border p-6 transition hover:shadow-md"
                  style={{ borderColor: "var(--shop-border)" }}
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: f.iconBg }}
                  >
                    <Icon className="h-5 w-5" style={{ color: f.iconColor }} strokeWidth={1.75} aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-[15px] font-bold text-shop-ink">{f.title}</h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-shop-muted">{f.body}</p>
                  </div>
                  <Link
                    href={f.href}
                    className="mt-auto inline-flex items-center self-start rounded-full px-4 py-1.5 text-xs font-bold transition hover:opacity-80"
                    style={{ background: f.ctaBg, color: f.ctaColor }}
                  >
                    {f.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}

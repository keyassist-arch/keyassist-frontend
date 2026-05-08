"use client";

import { FormEvent, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Star } from "lucide-react";
import { KeyAssistMark } from "@/components/ui/keyassist-logo";

const BRAND_COLOR = "#5C4AE6";

const MARKETPLACES = [
  { label: "Amazon",  href: "/shop?q=amazon",  slug: "amazon",  hex: "FF9900", iconBg: "#FFF8EE" },
  { label: "Apple",   href: "/shop?q=apple",   slug: "apple",   hex: "555555", iconBg: "#F5F5F7" },
  { label: "Nike",    href: "/shop?q=nike",     slug: "nike",    hex: "111111", iconBg: "#F5F5F5" },
  { label: "Jumia",   href: "/shop?q=jumia",    slug: "jumia",   hex: "F68B1E", iconBg: "#FFF5E6" },
  { label: "Walmart", href: "/shop?q=walmart",  slug: "walmart", hex: "0071CE", iconBg: "#EBF5FF" },
  { label: "eBay",    href: "/shop?q=ebay",     slug: "ebay",    hex: "E53238", iconBg: "#FFF0F0" },
  { label: "Etsy",    href: "/shop?q=etsy",     slug: "etsy",    hex: "F16521", iconBg: "#FFF2EC" },
  { label: "Target",  href: "/shop?q=target",   slug: "target",  hex: "CC0000", iconBg: "#FFF0F0" },
];

/* ── Floating decorative items ── */
type FloatItem =
  | { kind: "card"; title: string; sub: string; gradient: string }
  | { kind: "box";  label: string; gradient: string; textColor: string };

const FLOAT_ITEMS: FloatItem[] = [
  { kind: "card", title: "AirPods Pro (2nd gen)", sub: "(2.4k)", gradient: "linear-gradient(140deg,#e8eef5 0%,#c8d5e5 100%)" },
  { kind: "box",  label: "amazon",                gradient: "linear-gradient(140deg,#232f3e 0%,#131921 100%)",  textColor: "#FF9900" },
  { kind: "card", title: "Nike Air Max 90",        sub: "(1.8k)", gradient: "linear-gradient(140deg,#f0f0f0 0%,#d8d8d8 100%)" },
  { kind: "box",  label: "MUJI",                  gradient: "linear-gradient(140deg,#f5f5f5 0%,#e0e0e0 100%)", textColor: "#333333" },
  { kind: "card", title: "Jordan 1 Retro Low OG", sub: "(980)",  gradient: "linear-gradient(140deg,#ffe8d5 0%,#f5c4a0 100%)" },
  { kind: "box",  label: "eBay",                  gradient: "linear-gradient(140deg,#f5f5f5 0%,#e8e8e8 100%)", textColor: "#E53238" },
];

const HEIGHTS = [148, 120, 190, 100, 148, 88];
const ROTATIONS = ["-2deg", "0deg", "0deg", "0deg", "2deg", "0deg"];
const MARGINS_B = [16, 32, 0, 52, 16, 68];

function FloatCard({ title, sub, gradient, h, rotate, mb }: { title: string; sub: string; gradient: string; h: number; rotate: string; mb: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-[18px] bg-white shadow-[0_8px_28px_rgba(0,0,0,0.10)]"
      style={{ transform: `rotate(${rotate})`, marginBottom: mb, width: 148 }}
    >
      <div style={{ background: gradient, height: h }} />
      <div className="px-3 py-2">
        <p className="line-clamp-1 text-[11px] font-semibold text-gray-800">{title}</p>
        <span className="mt-0.5 inline-flex items-center gap-px">
          {[0,1,2,3,4].map(i => <Star key={i} size={9} fill="#F59E0B" strokeWidth={0} color="#F59E0B" />)}
          <span className="ml-1 text-[10px] text-gray-400">{sub}</span>
        </span>
      </div>
    </div>
  );
}

function FloatBox({ label, gradient, textColor, h, rotate, mb }: { label: string; gradient: string; textColor: string; h: number; rotate: string; mb: number }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-2xl shadow-[0_8px_28px_rgba(0,0,0,0.12)]"
      style={{ background: gradient, height: h, width: 96, transform: `rotate(${rotate})`, marginBottom: mb, display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <span className="text-center text-[11px] font-black uppercase tracking-wider px-2" style={{ color: textColor }}>
        {label}
      </span>
    </div>
  );
}

export function HomeShopHero() {
  const router = useRouter();
  const searchId = useId();
  const [q, setQ] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    router.push(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <section className="w-full bg-white">
      {/* ── Announcement bar ── */}
      <div className="flex w-full items-center justify-center gap-2 bg-black px-4 py-2.5 text-[13px] font-medium text-white">
        <KeyAssistMark size={22} className="shrink-0" />
        Download Key Assist app.&nbsp;Available on iOS &amp; Android
        <span className="ml-0.5 text-white/60" aria-hidden>→</span>
      </div>

      {/* ── Hero body ── */}
      <div className="bg-white px-4 pb-10 pt-8 sm:px-8">

        {/* Floating items row — desktop */}
        <div className="mx-auto mb-4 hidden max-w-[860px] items-end justify-center gap-2 lg:flex">
          {FLOAT_ITEMS.map((item, i) =>
            item.kind === "card" ? (
              <FloatCard
                key={i}
                title={item.title}
                sub={item.sub}
                gradient={item.gradient}
                h={HEIGHTS[i]}
                rotate={ROTATIONS[i]}
                mb={MARGINS_B[i]}
              />
            ) : (
              <FloatBox
                key={i}
                label={item.label}
                gradient={item.gradient}
                textColor={item.textColor}
                h={HEIGHTS[i]}
                rotate={ROTATIONS[i]}
                mb={MARGINS_B[i]}
              />
            )
          )}
        </div>

        {/* Brand + search + chips */}
        <div className="text-center">
          <h1
            className="text-[60px] font-black leading-none tracking-tight sm:text-[72px] lg:text-[84px]"
            style={{ color: BRAND_COLOR }}
          >
            key assist
          </h1>

          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500">
            Search across Amazon, Nike, Apple, Jumia and more — one cart, one checkout.
          </p>

          {/* Search */}
          <form id="hero-search" onSubmit={onSubmit} className="mx-auto mt-5 max-w-[540px]">
            <div className="flex items-center rounded-full border border-gray-200 bg-white px-5 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
              <label htmlFor={searchId} className="sr-only">What are you shopping for today?</label>
              <input
                id={searchId}
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="What are you shopping for today?"
                className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-90"
                style={{ background: BRAND_COLOR }}
                aria-label="Search"
              >
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </form>

          {/* Marketplace chips */}
          <div className="mt-5 flex items-center justify-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MARKETPLACES.map(({ label, href, slug, hex, iconBg }) => (
              <a
                key={label}
                href={href}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:shadow-md"
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ background: iconBg }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://cdn.simpleicons.org/${slug}/${hex}`}
                    alt=""
                    width={14}
                    height={14}
                    aria-hidden
                  />
                </span>
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

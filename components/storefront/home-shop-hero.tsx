"use client";

import { ClipboardEvent, FormEvent, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Star } from "lucide-react";
import { KeyAssistMark } from "@/components/ui/keyassist-logo";
import { useProductImportFromUrl } from "@/hooks/use-product-import-from-url";
import { motion } from "framer-motion";

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

const HEIGHTS    = [148, 120, 190, 100, 148, 88];
const ROTATIONS  = ["-2deg", "0deg", "0deg", "0deg", "2deg", "0deg"];
const MARGINS_B  = [16, 32, 0, 52, 16, 68];

function looksLikeUrl(v: string) {
  return /^https?:\/\//i.test(v.trim());
}

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
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    triggerImport,
    hasApiBase,
    isImportBlocking,
    effective,
    waitCopy,
  } = useProductImportFromUrl();

  const isUrl = looksLikeUrl(q);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const val = q.trim();
    if (!val) return;
    if (looksLikeUrl(val)) {
      triggerImport(val);
    } else {
      router.push(`/shop?q=${encodeURIComponent(val)}`);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (!looksLikeUrl(pasted)) return;
    // Let the paste land in the input, then auto-submit on the next frame
    e.preventDefault();
    setQ(pasted);
    // Small rAF so the input visually shows the pasted value before the overlay appears
    requestAnimationFrame(() => {
      triggerImport(pasted);
    });
  };

  return (
    <motion.section
      className="w-full bg-white"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
    >
      {/* Import overlay */}
      {isImportBlocking && (
        <div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-black/60 px-6 py-10 backdrop-blur-sm"
          role="alertdialog"
          aria-busy="true"
          aria-live="polite"
          aria-label="Import in progress"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
          <div className="max-w-md text-center">
            <p className="text-base font-semibold text-white">
              {effective?.userMessage ?? "On it — pulling in that listing"}
            </p>
            <p className="mt-3 text-sm text-white/75">{waitCopy}</p>
          </div>
        </div>
      )}

      {/* ── Announcement bar ── */}
      <motion.div
        className="flex w-full items-center justify-center gap-2 bg-black px-4 py-2.5 text-[13px] font-medium text-white"
        variants={{
          hidden: { opacity: 0, y: -6 },
          show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } },
        }}
      >
        <KeyAssistMark size={22} className="shrink-0" />
        Download Key Assist app.&nbsp;Available on iOS &amp; Android
        <span className="ml-0.5 text-white/60" aria-hidden>→</span>
      </motion.div>

      {/* ── Hero body ── */}
      <div className="bg-white px-4 pb-10 pt-8 sm:px-8">

        {/* Floating items row — desktop */}
        <div className="mx-auto mb-4 hidden max-w-[860px] items-end justify-center gap-2 lg:flex">
          {FLOAT_ITEMS.map((item, i) =>
            item.kind === "card" ? (
              <FloatCard key={i} title={item.title} sub={item.sub} gradient={item.gradient} h={HEIGHTS[i]} rotate={ROTATIONS[i]} mb={MARGINS_B[i]} />
            ) : (
              <FloatBox key={i} label={item.label} gradient={item.gradient} textColor={item.textColor} h={HEIGHTS[i]} rotate={ROTATIONS[i]} mb={MARGINS_B[i]} />
            )
          )}
        </div>

        {/* Brand + search + chips */}
        <div className="text-center">
          <motion.h1
            className="text-[60px] font-black leading-none tracking-tight sm:text-[72px] lg:text-[84px]"
            style={{ color: BRAND_COLOR }}
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.32, 0.72, 0, 1] } },
            }}
          >
            key assist
          </motion.h1>

          <motion.p
            className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-gray-500"
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.32, 0.72, 0, 1] } },
            }}
          >
            Search across Amazon, Nike, Apple, Jumia and more — or paste a product link to import it instantly.
          </motion.p>

          {/* Search / import bar */}
          <motion.form
            id="hero-search"
            onSubmit={onSubmit}
            className="mx-auto mt-5 max-w-[540px]"
            suppressHydrationWarning
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.32, 0.72, 0, 1] } },
            }}
          >
            <div
              className={`flex items-center rounded-full border bg-white px-5 py-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.08)] transition-colors ${
                isUrl ? "border-[#5C4AE6]/40" : "border-gray-200"
              }`}
            >
              <label htmlFor={searchId} className="sr-only">
                {isUrl ? "Import product from link" : "What are you shopping for today?"}
              </label>
              <input
                ref={inputRef}
                id={searchId}
                value={q}
                onChange={e => setQ(e.target.value)}
                onPaste={onPaste}
                placeholder="Search products or paste a link to import"
                className="w-full bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                disabled={isImportBlocking}
                suppressHydrationWarning
              />
              <button
                type="submit"
                disabled={isImportBlocking}
                className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: BRAND_COLOR }}
                aria-label={isUrl ? "Import product" : "Search"}
                suppressHydrationWarning
              >
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
            {isUrl && (
              <p className="mt-2 text-center text-xs text-[#5C4AE6]">
                Product link detected — press Enter or ↵ to import
              </p>
            )}
          </motion.form>

          {/* Marketplace chips */}
          <motion.div
            className="mt-5 flex items-center justify-center gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            variants={{
              hidden: { opacity: 0, y: 12 },
              show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.32, 0.72, 0, 1] } },
            }}
          >
            {MARKETPLACES.map(({ label, href, slug, hex, iconBg }) => (
              <motion.a
                key={label}
                href={href}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:shadow-md"
                whileHover={{ y: -1 }}
                transition={{ duration: 0.16, ease: [0.32, 0.72, 0, 1] }}
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
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

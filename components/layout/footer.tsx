import Link from "next/link";
import { KeyRound, Send } from "lucide-react";

import { FooterNewsletter } from "./footer-newsletter";

const SHOP_COL = [
  { label: "All products", href: "/shop" },
  { label: "Categories", href: "/shop" },
  { label: "Import a link", href: "/#hero-search" },
  { label: "Deals & offers", href: "/shop" },
];

const COMPANY_COL = [
  { label: "How it works", href: "/#how" },
  { label: "About us", href: "/" },
  { label: "Track order", href: "/dashboard/orders" },
  { label: "Contact", href: "/contact" },
];

const SUPPORT_COL = [
  { label: "Help center", href: "/faq" },
  { label: "Shipping & customs", href: "/faq" },
  { label: "Returns", href: "/faq" },
  { label: "FAQ", href: "/faq" },
];

const SOCIALS = [
  { label: "Instagram", slug: "instagram" },
  { label: "X (Twitter)", slug: "x" },
  { label: "Facebook", slug: "facebook" },
] as const;

const LEGAL = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Cookies", href: "/privacy" },
];

export function Footer() {
  return (
    <footer className="w-full px-6 pb-28 pt-16 sm:px-24 lg:pb-7" style={{ background: "var(--shop-dark)" }}>
      <div className="mx-auto flex max-w-(--shop-layout-max) flex-col gap-10 lg:flex-row lg:justify-between">
        <div className="flex w-full max-w-[320px] flex-col gap-[18px]">
          <Link href="/" aria-label="Key Assist home" className="flex items-center gap-[9px]">
            <span
              className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px]"
              style={{ background: "var(--shop-primary)" }}
            >
              <KeyRound className="h-[18px] w-[18px] text-white" aria-hidden />
            </span>
            <span className="text-xl font-bold text-white">key assist</span>
          </Link>
          <p className="max-w-[300px] text-sm leading-[1.6]" style={{ color: "#9C968F" }}>
            One cart for every US marketplace, delivered to Nigeria. Verified, transparent, and tracked door to door.
          </p>
          <div className="flex gap-2.5 pt-1.5">
            {SOCIALS.map(({ label, slug }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="flex h-[38px] w-[38px] items-center justify-center rounded-full transition hover:opacity-80"
                style={{ background: "#2A2523" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://cdn.simpleicons.org/${slug}/D6D0CA`} alt="" width={17} height={17} aria-hidden />
              </a>
            ))}
            <a
              href="#"
              aria-label="Telegram"
              className="flex h-[38px] w-[38px] items-center justify-center rounded-full transition hover:opacity-80"
              style={{ background: "#2A2523" }}
            >
              <Send className="h-[17px] w-[17px]" style={{ color: "#D6D0CA" }} aria-hidden />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:flex lg:gap-16">
          <FooterCol title="Shop" links={SHOP_COL} />
          <FooterCol title="Company" links={COMPANY_COL} />
          <FooterCol title="Support" links={SUPPORT_COL} />
        </div>

        <div className="flex w-full max-w-[280px] flex-col gap-[14px]">
          <p className="text-[13px] font-bold text-white">Get 10% off your first order</p>
          <p className="text-[13px] leading-[1.5]" style={{ color: "#9C968F" }}>
            Deals and drops, straight to your inbox.
          </p>
          <FooterNewsletter />
        </div>
      </div>

      <div className="mx-auto mt-12 h-px w-full max-w-(--shop-layout-max)" style={{ background: "#3A3532" }} />

      <div className="mx-auto flex max-w-(--shop-layout-max) flex-col-reverse items-center gap-4 pt-6 sm:flex-row sm:justify-between">
        <p className="text-[13px]" style={{ color: "#8A847E" }}>
          © 2026 Key Assist. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          {LEGAL.map((l) => (
            <Link key={l.label} href={l.href} className="text-[13px] transition hover:text-white" style={{ color: "#8A847E" }}>
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="flex flex-col gap-[14px]">
      <p className="text-[13px] font-bold tracking-[0.5px] text-white">{title}</p>
      {links.map((l) => (
        <Link key={l.label} href={l.href} className="text-sm transition hover:text-white" style={{ color: "#9C968F" }}>
          {l.label}
        </Link>
      ))}
    </div>
  );
}

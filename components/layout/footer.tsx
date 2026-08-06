"use client";

import { useState } from "react";
import Link from "next/link";
import { siteContext } from "@/lib/site-context";
import { KeyAssistMark } from "@/components/ui/keyassist-logo";
import { ComingSoonModal } from "@/components/ui/coming-soon-modal";

type FooterLink =
  | { label: string; href: string }
  | { label: string; comingSoon: string };

const LINK_COLS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: "Pages",
    links: [
      { label: "Shop",  href: "/shop" },
      { label: "Cart",  href: "/cart" },
      { label: "Saves", href: "/saves" },
    ],
  },
  {
    heading: "Start selling",
    links: [
      { label: "For brands",     comingSoon: "For brands" },
      { label: "For creators",   comingSoon: "For creators" },
      { label: "Build your store", comingSoon: "Build your store" },
    ],
  },
  {
    heading: "Information",
    links: [
      { label: "How it works", href: "/#how" },
      { label: "Help center", href: "/faq" },
      { label: "Contact",     href: "/contact" },
    ],
  },
  {
    heading: "Social",
    links: [
      { label: "X (Twitter)", href: "#" },
      { label: "Instagram",   href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy",   href: "/privacy" },
    ],
  },
];

export function Footer() {
  const [modalFeature, setModalFeature] = useState<string | null>(null);

  return (
    <>
      <footer className="w-full border-t border-gray-100 bg-white pb-20 pt-14 text-sm lg:pb-14 lg:pl-[84px]">
        <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
          <div className="grid gap-10 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr]">
            {/* Brand + app download */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <KeyAssistMark size={34} />
                <p className="text-[20px] font-black tracking-tight text-gray-900">
                  {siteContext.brand}
                </p>
              </div>
              <p className="max-w-[200px] text-[13px] leading-relaxed text-gray-500">
                {siteContext.brand} is the next step on our mission to make commerce better for everyone.
              </p>
            </div>

            {/* Link columns */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
              {LINK_COLS.map((col) => (
                <div key={col.heading} className="space-y-3">
                  <p className="text-[12px] font-bold text-gray-900">{col.heading}</p>
                  {col.links.map((l) =>
                    "comingSoon" in l ? (
                      <button
                        key={l.label}
                        type="button"
                        onClick={() => setModalFeature(l.comingSoon)}
                        className="block text-[13px] text-gray-500 transition hover:text-gray-900"
                      >
                        {l.label}
                      </button>
                    ) : (
                      <Link
                        key={l.label}
                        href={l.href}
                        className="block text-[13px] text-gray-500 transition hover:text-gray-900"
                      >
                        {l.label}
                      </Link>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col gap-3 border-t border-gray-100 pt-6 text-[12px] text-gray-400 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Powered by{" "}
              <Link href="/" className="font-semibold text-gray-600 hover:text-gray-900">
                Key Assist
              </Link>
              {" "}·{" "}
              <button
                type="button"
                onClick={() => setModalFeature("Build your store")}
                className="hover:text-gray-600"
              >
                Start selling for free
              </button>
            </p>
            <p>© Key Assist Inc. {new Date().getFullYear()}.</p>
          </div>
        </div>
      </footer>

      <ComingSoonModal
        open={modalFeature !== null}
        onClose={() => setModalFeature(null)}
        feature={modalFeature ?? ""}
      />
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Menu, Search, ShoppingBag, Sparkles, X } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useCart } from "@/context/cart-context";
import { useGetCartQuery } from "@/store/routes/unified-commerce-api";
import { OpenCartTrigger } from "@/components/cart/open-cart-trigger";
import { loginUrl } from "@/lib/auth-redirect";

const NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "How it works", href: "/#how" },
  { label: "Track order", href: "/dashboard/orders" },
  { label: "Support", href: "/contact" },
];

export function Header() {
  const pathname = usePathname();
  const token = useAppSelector((s) => s.auth.accessToken);
  const { items: localCartItems } = useCart();
  const { data: apiCart } = useGetCartQuery(undefined, { skip: !token });
  const cartCount = token
    ? (apiCart?.items ?? []).reduce((sum, i) => sum + i.quantity, 0)
    : localCartItems.reduce((sum, i) => sum + i.quantity, 0);

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <div className="sticky top-0 z-40 w-full">
      {/* ── Announcement bar ── */}
      <div
        className="flex w-full items-center justify-center gap-2.5 px-6 py-2.5 text-[13px]"
        style={{ background: "var(--shop-dark)" }}
      >
        <Sparkles className="h-[15px] w-[15px] shrink-0" style={{ color: "#34D399" }} aria-hidden />
        <span className="hidden font-medium text-white sm:inline">
          Flat 10% off all items this week — paste any product link to import it instantly
        </span>
        <span className="font-medium text-white sm:hidden">Flat 10% off all items this week</span>
        <Link href="/shop" className="shrink-0 font-semibold" style={{ color: "#34D399" }}>
          Shop now →
        </Link>
      </div>

      {/* ── Nav header ── */}
      <header className="w-full border-b border-shop-border bg-white">
        <div className="mx-auto flex max-w-(--shop-layout-max) items-center justify-between gap-6 px-4 py-[18px] sm:px-8 lg:px-24">
          <Link href="/" aria-label="Key Assist home" className="flex shrink-0 items-center gap-[9px]">
            <span
              className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px]"
              style={{ background: "var(--shop-primary)" }}
            >
              <KeyRound className="h-[18px] w-[18px] text-white" aria-hidden />
            </span>
            <span className="text-xl font-bold" style={{ color: "var(--shop-primary)" }}>
              key assist
            </span>
          </Link>

          <nav className="hidden items-center gap-[30px] lg:flex" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-shop-muted transition hover:text-shop-ink"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3.5">
            <Link
              href="/shop"
              className="hidden w-[210px] items-center gap-2 rounded-full border border-shop-border bg-shop-surface px-3.5 py-[9px] text-sm text-shop-muted transition hover:border-shop-accent/40 lg:flex"
            >
              <Search className="h-[15px] w-[15px] shrink-0" aria-hidden />
              Search or paste a link
            </Link>

            <OpenCartTrigger
              aria-label="Cart"
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-shop-border bg-shop-surface text-shop-ink transition hover:border-shop-accent/40"
            >
              <ShoppingBag className="h-[17px] w-[17px]" aria-hidden />
              {cartCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                  style={{ background: "var(--shop-sale)" }}
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </OpenCartTrigger>

            {token ? (
              <Link
                href="/dashboard"
                className="hidden shrink-0 items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 sm:inline-flex"
                style={{ background: "var(--shop-primary)" }}
              >
                My account
              </Link>
            ) : (
              <Link
                href={loginUrl(pathname)}
                className="hidden shrink-0 items-center rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 sm:inline-flex"
                style={{ background: "var(--shop-primary)" }}
              >
                Sign in
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-shop-border bg-shop-surface text-shop-ink lg:hidden"
            >
              <Menu className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[320px] flex-col gap-1 bg-white p-5 shadow-2xl lg:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-lg font-bold" style={{ color: "var(--shop-primary)" }}>
                  key assist
                </span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-shop-muted hover:bg-black/5"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-shop-ink hover:bg-black/5"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href={token ? "/dashboard" : loginUrl(pathname)}
                className="mt-3 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white"
                style={{ background: "var(--shop-primary)" }}
              >
                {token ? "My account" : "Sign in"}
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

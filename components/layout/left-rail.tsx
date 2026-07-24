"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutGrid, ShoppingBag, Package, Home, User, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { loginUrl, registerUrl } from "@/lib/auth-redirect";
import { useAppSelector } from "@/store/hooks";
import { useLocalSaves } from "@/context/saves-context";
import { useCart } from "@/context/cart-context";
import { OpenCartTrigger } from "@/components/cart/open-cart-trigger";
import { useGetCartQuery, useGetSavesQuery } from "@/store/routes/unified-commerce-api";
import { KeyAssistMark } from "@/components/ui/keyassist-logo";

const NAV_DRAWER_MS = 300;

const railBtn =
  "relative inline-flex h-11 w-11 items-center justify-center rounded-2xl text-shop-ink/65 transition hover:bg-black/5 hover:text-shop-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[color-mix(in_srgb,var(--shop-accent)_18%,transparent)]";

const NAV_LINKS = [
  { href: "/",        label: "Home",     icon: Home },
  { href: "/shop",    label: "Browse",   icon: LayoutGrid },
  { href: "/dashboard/orders", label: "Orders", icon: Package },
  { href: "/",        label: "Saved",    icon: Heart, isCart: false, isSaved: true },
];

export function LeftRail() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const pathname = usePathname();
  const profileHref = token ? "/dashboard" : loginUrl(pathname);
  const { localSavedIds } = useLocalSaves();
  const { data: serverSaves } = useGetSavesQuery(undefined, { skip: !token });
  const { data: apiCart } = useGetCartQuery(undefined, { skip: !token });
  const { items: localCartItems } = useCart();
  const cartCount = token
    ? (apiCart?.items ?? []).reduce((sum, i) => sum + i.quantity, 0)
    : localCartItems.reduce((sum, i) => sum + i.quantity, 0);
  const savedCount = token ? (serverSaves?.length ?? 0) : localSavedIds.size;

  const [navOpen, setNavOpen] = useState(false);
  const [navPresent, setNavPresent] = useState(false);
  const [navEnter, setNavEnter] = useState(false);

  useEffect(() => {
    if (navOpen) {
      setNavPresent(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setNavEnter(true));
      });
      return () => cancelAnimationFrame(id);
    }
    setNavEnter(false);
    const t = window.setTimeout(() => setNavPresent(false), NAV_DRAWER_MS);
    return () => window.clearTimeout(t);
  }, [navOpen]);

  useEffect(() => {
    if (!navPresent) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navPresent]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  const DRAWER_LINKS = [
    { href: "/",                   label: "Home",     icon: Home,        count: 0 },
    { href: "/shop",                label: "Browse",   icon: LayoutGrid,  count: 0 },
    { href: "/dashboard/orders",    label: "Orders",   icon: Package,     count: 0 },
    { href: "/cart",                label: "Cart",     icon: ShoppingBag, count: cartCount },
    { href: "/saves",               label: "Saved",    icon: Heart,       count: savedCount },
  ];

  const NavContent = () => (
    <>
      <Link href="/" aria-label="Home" className={railBtn}>
        <Home className="h-5 w-5" aria-hidden />
      </Link>
      <Link href="/shop" aria-label="Browse" className={railBtn}>
        <LayoutGrid className="h-5 w-5" aria-hidden />
      </Link>
      <Link href="/dashboard/orders" aria-label="Orders" className={railBtn}>
        <Package className="h-5 w-5" aria-hidden />
      </Link>
      <OpenCartTrigger aria-label="Cart" className={railBtn}>
        <ShoppingBag className="h-5 w-5" aria-hidden />
        {cartCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: "#059669" }}>
            {cartCount > 9 ? "9+" : cartCount}
          </span>
        )}
      </OpenCartTrigger>
      <Link href="/saves" aria-label="Saved" className={railBtn}>
        <Heart className="h-5 w-5" aria-hidden />
        {savedCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: "#059669" }}>
            {savedCount > 9 ? "9+" : savedCount}
          </span>
        )}
      </Link>
    </>
  );

  return (
    <>
      {/* Desktop left sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[84px] flex-col items-center bg-white py-5 lg:flex">
        {/* ── Logo ── */}
        <Link href="/" aria-label="Key Assist home" className="mb-2 flex h-11 w-11 items-center justify-center">
          <KeyAssistMark size={38} />
        </Link>

        {/* ── Nav links — centred vertically ── */}
        <div className="flex flex-1 flex-col items-center justify-center gap-1">
          <NavContent />
        </div>

        {/* ── Profile — bottom ── */}
        <Link
          href={profileHref}
          aria-label={token ? "Your account" : "Sign in"}
          className={railBtn}
          title={token ? "Your account" : "Sign in / Sign up"}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: token ? "#059669" : "#9CA3AF" }}>
            {token ? (
              <span className="text-[11px] font-bold text-white">Me</span>
            ) : (
              <User className="h-4 w-4 text-white" aria-hidden />
            )}
          </span>
        </Link>

        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-black/5" aria-hidden />
      </aside>

      {/* Mobile top bar */}
      <header
        className="fixed inset-x-0 top-0 z-30 border-b border-gray-200 bg-white lg:hidden"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" aria-label="Key Assist home" className="flex items-center gap-2">
            <KeyAssistMark size={30} />
            <span className="text-[15px] font-extrabold tracking-tight text-shop-ink">
              <span style={{ color: "#059669" }}>Key</span>Assist
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {!token && (
              <Link
                href={registerUrl(pathname)}
                className="btn-primary px-3.5 py-1.5 text-xs"
              >
                Get started
              </Link>
            )}
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className={railBtn}
              aria-label="Open menu"
              aria-expanded={navOpen}
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-in nav drawer */}
      {navPresent && (
        <div
          className="fixed inset-0 z-[100] flex justify-end lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-rail-nav-title"
        >
          <button
            type="button"
            className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ease-out ${
              navEnter ? "opacity-100" : "opacity-0"
            }`}
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          />
          <aside
            className={`relative flex h-full w-full max-w-[300px] flex-col overflow-y-auto bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out will-change-transform ${
              navEnter ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4">
              <span id="mobile-rail-nav-title" className="flex items-center gap-2">
                <KeyAssistMark size={30} />
                <span className="text-[15px] font-extrabold tracking-tight text-shop-ink">
                  <span style={{ color: "#059669" }}>Key</span>Assist
                </span>
              </span>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3" aria-label="Primary">
              {DRAWER_LINKS.map(({ href, label, icon: Icon, count }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={label}
                    href={href}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                      active ? "text-[#059669]" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    style={active ? { background: "var(--shop-accent-soft)" } : undefined}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[#059669]" : "text-gray-400"}`} aria-hidden />
                    {label}
                    {count > 0 && (
                      <span
                        className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold text-white"
                        style={{ background: "#059669" }}
                      >
                        {count > 9 ? "9+" : count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="shrink-0 border-t border-gray-100 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
              <Link
                href={profileHref}
                className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                  style={{ background: token ? "#059669" : "#9CA3AF" }}
                >
                  {token ? (
                    <span className="text-[9px] font-bold text-white">Me</span>
                  ) : (
                    <User className="h-3.5 w-3.5 text-white" aria-hidden />
                  )}
                </span>
                {token ? "Your account" : "Sign in / Sign up"}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

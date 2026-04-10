"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useId, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { siteContext } from "@/lib/site-context";
import { STORE_NAV_LINKS } from "@/lib/store-nav-links";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loggedOut } from "@/store/slices/authSlice";
import { useGetCartQuery } from "@/store/routes/unified-commerce-api";
import { IconCart, IconUser } from "@/components/storefront/header-icons";
import { OpenCartTrigger } from "@/components/cart/open-cart-trigger";

const iconLinkClass =
  "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-none text-shop-ink transition hover:bg-shop-accent-soft hover:text-shop-accent";

function AccountCartIcons({ cartLabel, cartCount }: { cartLabel: string; cartCount: number }) {
  return (
    <>
      <Link href="/dashboard" className={iconLinkClass} aria-label="Account" title="Account">
        <IconUser className="h-5 w-5" />
      </Link>
      <OpenCartTrigger className={iconLinkClass} aria-label={cartLabel} title="Cart">
        <IconCart className="h-5 w-5" />
        {cartCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-shop-primary px-1 text-[10px] font-semibold leading-none text-white">
            {cartCount > 99 ? "99+" : cartCount}
          </span>
        ) : null}
      </OpenCartTrigger>
    </>
  );
}

export function StoreMainHeader() {
  const { items: localItems } = useCart();
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: apiCart } = useGetCartQuery(undefined, { skip: !token });
  const router = useRouter();
  const [q, setQ] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const navPanelId = useId();

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [navOpen]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const cartCount = useMemo(() => {
    if (token && apiCart?.items) return apiCart.items.length;
    return localItems.length;
  }, [token, apiCart, localItems.length]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
  };

  const cartLabel =
    cartCount === 0 ? "Cart, empty" : cartCount === 1 ? "Cart, 1 item" : `Cart, ${cartCount} items`;

  return (
    <div className="w-full border-b bg-white" style={{ borderColor: "var(--shop-border)" }}>
      <div className="mx-auto flex max-w-[var(--shop-layout-max)] flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:gap-6 sm:px-8">
        {/* Mobile: brand + icons on one row; sm+: brand only in this cell */}
        <div className="flex w-full min-w-0 items-center justify-between gap-3 sm:w-auto sm:shrink-0 sm:justify-start">
          <Link href="/" className="min-w-0 truncate text-xl font-semibold tracking-tight text-shop-ink">
            {siteContext.brand}
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:hidden" aria-label="Account and cart">
            {token ? (
              <button
                type="button"
                className="rounded-none px-2 py-1.5 text-xs font-medium text-shop-muted hover:bg-shop-accent-soft hover:text-shop-accent"
                onClick={() => dispatch(loggedOut())}
              >
                Sign out
              </button>
            ) : null}
            <AccountCartIcons cartLabel={cartLabel} cartCount={cartCount} />
            <button
              type="button"
              className={iconLinkClass}
              aria-expanded={navOpen}
              aria-controls={navPanelId}
              aria-label="Open menu"
              onClick={() => setNavOpen(true)}
            >
              <Menu className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex min-w-0 flex-1 items-center gap-2">
          <label htmlFor="store-search" className="sr-only">
            Search products or paste marketplace URL
          </label>
          <input
            id="store-search"
            type="search"
            enterKeyHint="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search or paste Amazon, Nike, Apple, Jumia URL…"
            className="input min-h-11 min-w-0 flex-1 rounded-none border-neutral-200"
            style={{ borderColor: "var(--shop-border)", borderRadius: 0 }}
          />
          <button type="submit" className="btn-primary shrink-0 px-5 py-2.5 text-sm">
            Search
          </button>
        </form>

        {/* sm+: auth text links + icons (Sign in / Register hidden on narrow screens) */}
        <div className="hidden shrink-0 flex-wrap items-center justify-end gap-1 sm:flex sm:gap-2">
          {token ? (
            <button
              type="button"
              className="rounded-none px-3 py-2 text-sm text-shop-muted hover:bg-shop-accent-soft hover:text-shop-accent"
              onClick={() => dispatch(loggedOut())}
            >
              Sign out
            </button>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="rounded-none px-3 py-2 text-sm text-shop-muted hover:bg-shop-accent-soft hover:text-shop-accent"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="rounded-none px-3 py-2 text-sm text-shop-muted hover:bg-shop-accent-soft hover:text-shop-accent"
              >
                Register
              </Link>
            </>
          )}
          <AccountCartIcons cartLabel={cartLabel} cartCount={cartCount} />
          <button
            type="button"
            className={`${iconLinkClass} lg:hidden`}
            aria-expanded={navOpen}
            aria-controls={navPanelId}
            aria-label="Open menu"
            onClick={() => setNavOpen(true)}
          >
            <Menu className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>

      {/* Primary nav drawer: screens below lg (hamburger beside cart in header) */}
      {navOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          />
          <nav
            id={navPanelId}
            className="absolute left-0 top-0 flex h-full w-[min(100%,18rem)] flex-col border-r border-black/10 bg-white shadow-lg"
            style={{ borderColor: "var(--shop-border)" }}
            aria-labelledby={`${navPanelId}-title`}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="flex items-center justify-between border-b border-black/10 px-4 py-3"
              style={{ borderColor: "var(--shop-border)" }}
            >
              <span id={`${navPanelId}-title`} className="text-sm font-semibold text-shop-ink">
                Browse
              </span>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-none text-shop-ink hover:bg-black/5"
                aria-label="Close menu"
                onClick={() => setNavOpen(false)}
              >
                <X className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </button>
            </div>
            <ul className="flex flex-col gap-0 p-2">
              {STORE_NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="block rounded-none px-4 py-3 text-sm font-medium text-shop-ink hover:bg-shop-accent-soft"
                    onClick={() => setNavOpen(false)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      ) : null}
    </div>
  );
}

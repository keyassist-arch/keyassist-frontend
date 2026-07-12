"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { loginUrl, registerUrl } from "@/lib/auth-redirect";
import { ClipboardEvent, FormEvent, useEffect, useId, useMemo, useState } from "react";
import { Menu, X, ShoppingBag } from "lucide-react";
import { siteContext } from "@/lib/site-context";
import { STORE_NAV_LINKS } from "@/lib/store-nav-links";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loggedOut } from "@/store/slices/authSlice";
import { useGetWannaBuyItemsQuery } from "@/store/routes/unified-commerce-api";
import { IconUser } from "@/components/storefront/header-icons";
import { useProductImportFromUrl } from "@/hooks/use-product-import-from-url";

function looksLikeUrl(v: string) {
  return /^https?:\/\//i.test(v.trim());
}

const MARKET_CHIPS = [
  { label: "Amazon",  q: "amazon"  },
  { label: "Apple",   q: "apple"   },
  { label: "Nike",    q: "nike"    },
  { label: "GOAT",    q: "goat"    },
  { label: "eBay",    q: "ebay"    },
];

const iconBtn =
  "relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-shop-ink transition hover:bg-shop-accent-soft hover:text-shop-accent";

function WannaBuyUserIcons({ wannaBuyLabel, wannaBuyCount }: { wannaBuyLabel: string; wannaBuyCount: number }) {
  return (
    <>
      <Link href="/dashboard" className={iconBtn} aria-label="Account" title="Account">
        <IconUser className="h-[18px] w-[18px]" />
      </Link>
      <Link href="/dashboard/wanna-buy" className={iconBtn} aria-label={wannaBuyLabel} title="Wanna Buy list">
        <ShoppingBag className="h-[18px] w-[18px]" />
        {wannaBuyCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-shop-primary px-0.5 text-[9px] font-bold leading-none text-white">
            {wannaBuyCount > 99 ? "99+" : wannaBuyCount}
          </span>
        )}
      </Link>
    </>
  );
}

export function StoreMainHeader() {
  const dispatch = useAppDispatch();
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: wannaBuyItems } = useGetWannaBuyItemsQuery(undefined, { skip: !token });
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [navOpen, setNavOpen] = useState(false);
  const navPanelId = useId();

  useEffect(() => {
    if (!navOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [navOpen]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setNavOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  const wannaBuyCount = useMemo(() => {
    if (!token || !wannaBuyItems) return 0;
    return wannaBuyItems.filter((i) => !["cancelled", "expired"].includes(i.status)).length;
  }, [token, wannaBuyItems]);

  const wannaBuyLabel =
    wannaBuyCount === 0
      ? "Wanna Buy list, empty"
      : wannaBuyCount === 1
        ? "Wanna Buy list, 1 item"
        : `Wanna Buy list, ${wannaBuyCount} items`;

  const {
    triggerImport,
    isImportBlocking,
    effective,
    waitCopy,
  } = useProductImportFromUrl();

  const isUrl = looksLikeUrl(q);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    if (!t) return;
    if (looksLikeUrl(t)) {
      triggerImport(t);
    } else {
      router.push(`/shop?q=${encodeURIComponent(t)}`);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").trim();
    if (!looksLikeUrl(pasted)) return;
    e.preventDefault();
    setQ(pasted);
    requestAnimationFrame(() => {
      triggerImport(pasted);
    });
  };

  return (
    <>
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
    <div className="w-full border-b bg-white/70" style={{ borderColor: "var(--shop-border)" }}>
      <div className="mx-auto max-w-[var(--shop-layout-max)] px-4 sm:px-8">

        {/* ── Row 1: brand · nav · auth ── */}
        <div className="flex h-14 items-center gap-3">

          {/* Brand */}
          <Link
            href="/"
            className="shrink-0 text-[15px] font-extrabold tracking-tight text-shop-ink"
          >
            <span style={{ color: "var(--shop-accent)" }}>Key</span>
            <span className="text-shop-ink">Assist</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="ml-2 hidden flex-1 items-center gap-0.5 lg:flex" aria-label="Primary">
            {STORE_NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-3 py-1.5 text-sm font-medium text-shop-ink/65 transition hover:bg-shop-accent-soft hover:text-shop-accent"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex-1 lg:hidden" />

          {/* Auth + Wanna Buy */}
          <div className="flex shrink-0 items-center gap-1">
            {token ? (
              <button
                type="button"
                className="hidden rounded-xl px-3 py-1.5 text-sm text-shop-muted transition hover:bg-shop-accent-soft hover:text-shop-accent sm:block"
                onClick={() => dispatch(loggedOut())}
              >
                Sign out
              </button>
            ) : (
              <div className="hidden items-center gap-1 sm:flex">
                <Link
                  href={loginUrl(pathname)}
                  className="rounded-xl px-3 py-1.5 text-sm text-shop-muted transition hover:bg-shop-accent-soft hover:text-shop-accent"
                >
                  Sign in
                </Link>
                <Link
                  href={registerUrl(pathname)}
                  className="rounded-xl border px-3 py-1.5 text-sm font-semibold text-shop-ink transition hover:bg-shop-accent-soft hover:text-shop-accent"
                  style={{ borderColor: "var(--shop-border)" }}
                >
                  Register
                </Link>
              </div>
            )}
            <WannaBuyUserIcons wannaBuyLabel={wannaBuyLabel} wannaBuyCount={wannaBuyCount} />
            <button
              type="button"
              className={`${iconBtn} lg:hidden`}
              aria-expanded={navOpen}
              aria-controls={navPanelId}
              aria-label="Open menu"
              onClick={() => setNavOpen(true)}
            >
              <Menu className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>

        {/* ── Row 2: search + marketplace chips ── */}
        <div className="pb-3">
          <form onSubmit={onSubmit} className="flex items-center gap-2">
            <label htmlFor="store-search" className="sr-only">
              {isUrl ? "Import product from link" : "Search or paste marketplace URL"}
            </label>
            <div className="relative min-w-0 flex-1">
              <input
                id="store-search"
                type="search"
                enterKeyHint="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onPaste={onPaste}
                placeholder="Search or paste a product URL — Amazon, Nike, Apple, GOAT…"
                className="input min-h-11 w-full text-sm"
                style={{ borderColor: isUrl ? "var(--shop-accent)" : "var(--shop-border)" }}
                disabled={isImportBlocking}
              />
              {isUrl && (
                <p className="mt-1 text-[11px] text-shop-accent">
                  Product link detected — press Enter or click Import
                </p>
              )}
            </div>
            <button
              type="submit"
              className="btn-primary shrink-0 self-start px-5 py-2 text-sm"
              disabled={isImportBlocking}
            >
              {isUrl ? "Import" : "Search"}
            </button>
          </form>

          {/* Quick-filter chips — clicking jumps to shop filtered by marketplace */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-shop-muted">Shop on:</span>
            {MARKET_CHIPS.map((c) => (
              <button
                key={c.q}
                type="button"
                onClick={() => router.push(`/shop?q=${encodeURIComponent(c.q)}`)}
                className="rounded-full border px-3 py-0.5 text-[11px] font-semibold transition hover:border-shop-accent hover:bg-shop-accent-soft hover:text-shop-accent"
                style={{ borderColor: "var(--shop-border)", color: "var(--shop-muted)" }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile drawer (slides from right) ── */}
      {navOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setNavOpen(false)}
          />
          <nav
            id={navPanelId}
            className="absolute right-0 top-0 flex h-full w-[min(100%,22rem)] flex-col bg-white shadow-2xl"
            aria-labelledby={`${navPanelId}-title`}
            role="dialog"
            aria-modal="true"
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: "var(--shop-border)" }}
            >
              <span id={`${navPanelId}-title`} className="text-sm font-bold text-shop-ink">
                <span style={{ color: "var(--shop-accent)" }}>Key</span>Assist
              </span>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-black/5"
                aria-label="Close menu"
                onClick={() => setNavOpen(false)}
              >
                <X className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </button>
            </div>

            {/* Nav links */}
            <ul className="flex flex-col gap-0.5 p-3">
              {STORE_NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="block rounded-xl px-4 py-3 text-sm font-medium text-shop-ink transition hover:bg-shop-accent-soft hover:text-shop-accent"
                    onClick={() => setNavOpen(false)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Marketplace chips in drawer */}
            <div className="px-4 pb-2">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-shop-muted">
                Quick shop
              </p>
              <div className="flex flex-wrap gap-1.5">
                {MARKET_CHIPS.map((c) => (
                  <button
                    key={c.q}
                    type="button"
                    onClick={() => {
                      router.push(`/shop?q=${encodeURIComponent(c.q)}`);
                      setNavOpen(false);
                    }}
                    className="rounded-full border px-3 py-1 text-xs font-semibold transition hover:border-shop-accent hover:bg-shop-accent-soft hover:text-shop-accent"
                    style={{ borderColor: "var(--shop-border)", color: "var(--shop-muted)" }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auth at the bottom */}
            <div
              className="mt-auto border-t p-4"
              style={{ borderColor: "var(--shop-border)" }}
            >
              {token ? (
                <button
                  type="button"
                  className="btn-secondary w-full text-sm"
                  onClick={() => { dispatch(loggedOut()); setNavOpen(false); }}
                >
                  Sign out
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href={loginUrl(pathname)}
                    className="btn-primary w-full text-center text-sm"
                    onClick={() => setNavOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href={registerUrl(pathname)}
                    className="btn-secondary w-full text-center text-sm"
                    onClick={() => setNavOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </div>
    </>
  );
}

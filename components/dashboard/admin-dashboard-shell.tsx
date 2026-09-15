"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  Settings,
  User,
  LogOut,
  AlertCircle,
  CreditCard,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { InnerShell } from "@/components/layout/inner-shell";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useGetMeQuery } from "@/store/routes/unified-commerce-api";
import { loggedOut } from "@/store/slices/authSlice";
import { LoadingState } from "@/components/feedback/query-state";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { ADMIN_NAV, canSeeAdminSection } from "@/lib/admin-nav";

const NAV_DRAWER_MS = 300;

const ACCOUNT_NAV = [
  { href: "/dashboard",                 label: "Overview",        icon: LayoutDashboard, end: true  },
  { href: "/dashboard/orders",          label: "My Orders",       icon: Package,         end: false },
  { href: "/dashboard/disputes",        label: "Disputes",        icon: AlertCircle,     end: false },
  { href: "/dashboard/payment-methods", label: "Payment Methods", icon: CreditCard,      end: false },
  { href: "/dashboard/profile",         label: "Profile",         icon: User,            end: false },
  { href: "/dashboard/settings",        label: "Settings",        icon: Settings,        end: false },
] as const;

function navActive(pathname: string, href: string, end: boolean) {
  if (end) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function initials(first?: string | null, last?: string | null, email?: string | null) {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first) return first.slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

export function AdminDashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const token = useAppSelector((s) => s.auth.accessToken);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data: me, isLoading: meLoading } = useGetMeQuery(undefined, { skip: !token });
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [navPresent, setNavPresent] = useState(false);
  const [navEnter, setNavEnter] = useState(false);

  const isAdmin = me?.role === "ADMIN_SUPER" || me?.role === "ADMIN_STAFF";
  const isLoginPage = pathname === "/admin/login";

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

  if (!token && !isLoginPage) {
    return (
      <InnerShell>
        <section className="mx-auto max-w-lg rounded-[20px] border border-shop-border bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-shop-ink">Admin sign in</h1>
          <p className="mt-2 text-sm text-shop-muted">Sign in with a staff account to access the admin panel.</p>
          <Link
            href="/admin/login"
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-shop-primary py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Sign in
          </Link>
        </section>
      </InnerShell>
    );
  }

  if (meLoading) {
    return (
      <InnerShell>
        <LoadingState label="Verifying access…" />
      </InnerShell>
    );
  }

  if (!isAdmin && !isLoginPage) {
    return (
      <InnerShell>
        <section className="mx-auto max-w-lg rounded-[20px] border border-shop-border bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-shop-ink">Access denied</h1>
          <p className="mt-2 text-sm text-shop-muted">
            This page is only available to admin accounts.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-shop-border py-3 text-sm font-medium text-shop-ink transition hover:bg-(--background)"
          >
            Back to account
          </Link>
        </section>
      </InnerShell>
    );
  }

  const displayName = [me?.firstName, me?.lastName].filter(Boolean).join(" ") || me?.email || "Admin";
  const ini = initials(me?.firstName, me?.lastName, me?.email);
  const roleLabel = me?.role === "ADMIN_SUPER" ? "Super Admin" : "Staff Admin";
  const visibleNav = ADMIN_NAV.filter((item) => canSeeAdminSection(me, item.permission));

  const onSignOut = () => {
    dispatch(loggedOut());
    router.push("/");
  };

  const signOutModal = (
    <ConfirmModal
      open={showSignOutModal}
      title="Sign out"
      description="Are you sure you want to sign out of the admin panel?"
      confirmLabel="Sign out"
      danger
      onConfirm={() => { setShowSignOutModal(false); onSignOut(); }}
      onCancel={() => setShowSignOutModal(false)}
    />
  );

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="mx-auto w-full max-w-(--shop-layout-max) px-4 py-8 pb-8 sm:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          {/* Sidebar */}
          <aside className="hidden shrink-0 lg:block lg:w-60">
            {/* User card */}
            <div className="mb-6 flex items-center gap-3 rounded-2xl bg-(--background) px-4 py-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-shop-primary text-sm font-bold text-white"
                aria-hidden
              >
                {ini}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-shop-ink">{displayName}</p>
                <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-shop-accent-soft px-2 py-0.5 text-[10px] font-semibold text-shop-primary">
                  <ShieldCheck className="h-3 w-3" />
                  {roleLabel}
                </span>
              </div>
            </div>

            {/* Navigation */}
            <div className="space-y-6">
              {/* Account Section */}
              <div>
                <p className="px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-shop-muted">
                  My Account
                </p>
                <nav className="flex flex-col gap-1" aria-label="Account navigation">
                  {ACCOUNT_NAV.map(({ href, label, icon: Icon, end }) => {
                    const active = navActive(pathname, href, end);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                          active
                            ? "bg-shop-accent-soft text-shop-primary font-semibold"
                            : "text-shop-muted hover:bg-(--background) hover:text-shop-ink"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${active ? "text-shop-primary" : "text-shop-muted"}`}
                          aria-hidden
                        />
                        {label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Admin Section */}
              <div className="border-t border-shop-border/80 pt-5">
                <div className="flex items-center gap-1.5 px-3.5 pb-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-shop-primary" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-shop-ink">
                    Admin Console
                  </p>
                </div>
                <nav className="flex flex-col gap-1" aria-label="Admin navigation">
                  {visibleNav.map(({ href, label, icon: Icon, end }) => {
                    const active = navActive(pathname, href, end);
                    const displayLabel = href === "/admin/orders" ? "Store Orders" : href === "/admin" ? "Store Overview" : label;
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                          active
                            ? "bg-shop-accent-soft text-shop-primary font-semibold"
                            : "text-shop-muted hover:bg-(--background) hover:text-shop-ink"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${active ? "text-shop-primary" : "text-shop-muted"}`}
                          aria-hidden
                        />
                        {displayLabel}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Sign out */}
            <button
              type="button"
              onClick={() => setShowSignOutModal(true)}
              className="mt-6 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-shop-muted transition hover:bg-(--background) hover:text-shop-ink"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              Sign out
            </button>
          </aside>

          {/* Content */}
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>

      {/* Mobile hamburger trigger */}
      <button
        type="button"
        onClick={() => setNavOpen(true)}
        className="fixed bottom-5 right-4 z-[9999] flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_24px_rgba(0,0,0,0.24)] transition active:scale-95 lg:hidden"
        style={{ background: "var(--shop-primary)" }}
        aria-label="Open navigation"
      >
        <Menu className="h-6 w-6" aria-hidden />
      </button>

      {/* Mobile slide-in nav drawer */}
      {navPresent && (
        <div
          className="fixed inset-0 z-[9999] flex justify-end lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-admin-nav-title"
        >
          <button
            type="button"
            className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ease-out ${
              navEnter ? "opacity-100" : "opacity-0"
            }`}
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
          />
          <aside
            className={`relative flex h-full w-full max-w-[300px] flex-col overflow-y-auto bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out will-change-transform ${
              navEnter ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-shop-border px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-shop-primary text-sm font-bold text-white"
                  aria-hidden
                >
                  {ini}
                </span>
                <div className="min-w-0">
                  <p id="mobile-admin-nav-title" className="truncate text-sm font-semibold text-shop-ink">
                    {displayName}
                  </p>
                  <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-shop-accent-soft px-2 py-0.5 text-[10px] font-semibold text-shop-primary">
                    <ShieldCheck className="h-3 w-3" />
                    {roleLabel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-shop-muted transition hover:bg-(--background) hover:text-shop-ink"
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
              {/* Mobile Account Section */}
              <div>
                <p className="px-3.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-shop-muted">
                  My Account
                </p>
                <nav className="flex flex-col gap-1" aria-label="Account navigation">
                  {ACCOUNT_NAV.map(({ href, label, icon: Icon, end }) => {
                    const active = navActive(pathname, href, end);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                          active
                            ? "bg-shop-accent-soft text-shop-primary font-semibold"
                            : "text-shop-muted hover:bg-(--background) hover:text-shop-ink"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${active ? "text-shop-primary" : "text-shop-muted"}`}
                          aria-hidden
                        />
                        {label}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile Admin Section */}
              <div className="border-t border-shop-border/80 pt-4">
                <div className="flex items-center gap-1.5 px-3.5 pb-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-shop-primary" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-shop-ink">
                    Admin Console
                  </p>
                </div>
                <nav className="flex flex-col gap-1" aria-label="Admin navigation">
                  {visibleNav.map(({ href, label, icon: Icon, end }) => {
                    const active = navActive(pathname, href, end);
                    const displayLabel = href === "/admin/orders" ? "Store Orders" : href === "/admin" ? "Store Overview" : label;
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition ${
                          active
                            ? "bg-shop-accent-soft text-shop-primary font-semibold"
                            : "text-shop-muted hover:bg-(--background) hover:text-shop-ink"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${active ? "text-shop-primary" : "text-shop-muted"}`}
                          aria-hidden
                        />
                        {displayLabel}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>

            <div className="shrink-0 border-t border-shop-border p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
              <button
                type="button"
                onClick={() => {
                  setNavOpen(false);
                  setShowSignOutModal(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-shop-muted transition hover:bg-(--background) hover:text-shop-ink"
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      {signOutModal}
    </>
  );
}

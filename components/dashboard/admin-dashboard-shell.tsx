"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Package, LogOut, AlertCircle, Banknote, Bug } from "lucide-react";
import { InnerShell } from "@/components/layout/inner-shell";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useGetMeQuery } from "@/store/routes/unified-commerce-api";
import { loggedOut } from "@/store/slices/authSlice";
import { LoadingState } from "@/components/feedback/query-state";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { href: "/admin/orders", label: "Orders", icon: Package, end: false },
  { href: "/admin/products", label: "Products", icon: Bug, end: false },
  { href: "/admin/refunds", label: "Refunds", icon: Banknote, end: false },
  { href: "/admin/issues", label: "Issues", icon: AlertCircle, end: false },
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

  const isAdmin = me?.role === "ADMIN_SUPER" || me?.role === "ADMIN_STAFF";
  const isLoginPage = pathname === "/admin/login";

  if (!token && !isLoginPage) {
    return (
      <InnerShell>
        <section className="mx-auto max-w-lg rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Admin sign in</h1>
          <p className="mt-2 text-sm text-gray-500">Sign in with a staff account to access the admin panel.</p>
          <Link
            href="/admin/login"
            className="mt-5 inline-flex w-full items-center justify-center rounded-full py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "#5C4AE6" }}
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
        <section className="mx-auto max-w-lg rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Access denied</h1>
          <p className="mt-2 text-sm text-gray-500">
            This page is only available to admin accounts.
          </p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex w-full items-center justify-center rounded-full border border-gray-200 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Back to account
          </Link>
        </section>
      </InnerShell>
    );
  }

  const displayName = [me?.firstName, me?.lastName].filter(Boolean).join(" ") || me?.email || "Admin";
  const ini = initials(me?.firstName, me?.lastName, me?.email);

  const onSignOut = () => {
    dispatch(loggedOut());
    router.push("/");
  };

  const signOutModal = showSignOutModal && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Sign out</h3>
        <p className="mt-2 text-sm text-gray-500">Are you sure you want to sign out of the admin panel?</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={() => setShowSignOutModal(false)}
            className="flex-1 rounded-full border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { setShowSignOutModal(false); onSignOut(); }}
            className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="mx-auto w-full max-w-(--shop-layout-max) px-4 py-8 pb-24 sm:px-8 lg:pb-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          <aside className="hidden shrink-0 lg:block lg:w-60">
            <div className="mb-6 flex items-center gap-3 rounded-2xl bg-gray-50 px-4 py-4">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: "#5C4AE6" }}
                aria-hidden
              >
                {ini}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
                <p className="truncate text-[11px] text-gray-400">
                  {me?.role === "ADMIN_SUPER" ? "Super admin" : "Staff"}
                </p>
              </div>
            </div>

            <nav className="flex flex-wrap gap-1 lg:flex-col" aria-label="Admin navigation">
              {NAV.map(({ href, label, icon: Icon, end }) => {
                const active = navActive(pathname, href, end);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                      active
                        ? "text-[#5C4AE6]"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                    style={active ? { background: "rgba(92,74,230,0.08)" } : undefined}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${active ? "text-[#5C4AE6]" : "text-gray-400"}`}
                      aria-hidden
                    />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={() => setShowSignOutModal(true)}
              className="mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 lg:mt-6"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden />
              Sign out
            </button>
          </aside>

          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>

      <nav
        className="fixed bottom-0 z-[9999] flex h-16 flex-col items-center justify-center border-t border-gray-200 bg-white/98 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur lg:hidden"
        aria-label="Admin navigation"
      >
        <div className="mx-auto flex w-full max-w-(--shop-layout-max) flex-1 items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)] pt-2">
          {NAV.map(({ href, label, icon: Icon, end }) => {
            const active = navActive(pathname, href, end);
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition ${
                  active ? "text-[#5C4AE6]" : "text-gray-500 hover:text-gray-900"
                }`}
                style={active ? { background: "rgba(92,74,230,0.08)" } : undefined}
              >
                <Icon className={`h-5 w-5 ${active ? "text-[#5C4AE6]" : "text-gray-400"}`} aria-hidden />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setShowSignOutModal(true)}
            className="flex flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-gray-500 transition hover:text-gray-900"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5 text-gray-400" aria-hidden />
            <span className="truncate">Sign out</span>
          </button>
        </div>
      </nav>

      {signOutModal}
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Settings,
  User,
  LogOut,
  AlertCircle,
} from "lucide-react";
import { InnerShell } from "@/components/layout/inner-shell";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useGetMeQuery } from "@/store/routes/unified-commerce-api";
import { loggedOut } from "@/store/slices/authSlice";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/dashboard",           label: "Overview", icon: LayoutDashboard, end: true  },
  { href: "/dashboard/orders",    label: "Orders",   icon: Package,         end: false },
  { href: "/dashboard/disputes",  label: "Disputes", icon: AlertCircle,     end: false },
  { href: "/dashboard/profile",   label: "Profile",  icon: User,            end: false },
  { href: "/dashboard/settings",  label: "Settings", icon: Settings,        end: false },
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

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const token = useAppSelector((s) => s.auth.accessToken);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data: me } = useGetMeQuery(undefined, { skip: !token });

  if (!token) {
    return (
      <InnerShell>
        <section className="mx-auto max-w-lg rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Sign in to your account</h1>
          <p className="mt-2 text-sm text-gray-500">Manage orders, profile, and settings after signing in.</p>
          <Link
            href="/auth/login"
            className="mt-5 inline-flex w-full items-center justify-center rounded-full py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "#5C4AE6" }}
          >
            Sign in
          </Link>
        </section>
      </InnerShell>
    );
  }

  const displayName = [me?.firstName, me?.lastName].filter(Boolean).join(" ") || me?.email || "Account";
  const ini = initials(me?.firstName, me?.lastName, me?.email);

  const onSignOut = () => {
    dispatch(loggedOut());
    router.push("/");
  };

  return (
    <div className="mx-auto w-full max-w-(--shop-layout-max) px-4 py-8 sm:px-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">

        {/* Sidebar */}
        <aside className="shrink-0 lg:w-60">
          {/* User card */}
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
              {me?.email && (
                <p className="truncate text-[11px] text-gray-400">{me.email}</p>
              )}
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-wrap gap-1 lg:flex-col" aria-label="Dashboard navigation">
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

          {/* Sign out */}
          <button
            type="button"
            onClick={onSignOut}
            className="mt-4 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 lg:mt-6"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            Sign out
          </button>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

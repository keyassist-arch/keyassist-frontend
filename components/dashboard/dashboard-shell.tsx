"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Settings,
  User,
} from "lucide-react";
import { InnerShell } from "@/components/layout/inner-shell";
import { useAppSelector } from "@/store/hooks";

const NAV = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { href: "/dashboard/orders", label: "Orders", icon: Package, end: false },
  { href: "/dashboard/profile", label: "Profile", icon: User, end: false },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, end: false },
] as const;

function navActive(pathname: string, href: string, end: boolean): boolean {
  if (end) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const token = useAppSelector((s) => s.auth.accessToken);

  if (!token) {
    return (
      <InnerShell>
        <section className="card mx-auto max-w-lg">
          <h1 className="text-xl font-semibold">Account</h1>
          <p className="mt-2 text-sm text-black/70">Sign in to manage orders, profile, and settings.</p>
          <Link href="/auth/login" className="btn-primary mt-4 inline-block">
            Sign in
          </Link>
        </section>
      </InnerShell>
    );
  }

  return (
    <div className="mx-auto w-full max-w-(--shop-layout-max) px-4 py-8 sm:px-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        <aside className="shrink-0 lg:w-56">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-black/45">Account</p>
          <nav className="flex flex-wrap gap-2 border-b border-black/10 pb-4 lg:flex-col lg:border-b-0 lg:pb-0">
            {NAV.map(({ href, label, icon: Icon, end }) => {
              const active = navActive(pathname, href, end);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-2 rounded-none px-3 py-2 text-sm font-medium transition lg:w-full ${
                    active
                      ? "bg-shop-primary text-white"
                      : "text-shop-ink hover:bg-shop-accent-soft hover:text-shop-accent"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

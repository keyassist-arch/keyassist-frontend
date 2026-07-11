"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutGrid, ShoppingBag, Package, Home, User } from "lucide-react";
import { loginUrl } from "@/lib/auth-redirect";
import { useAppSelector } from "@/store/hooks";
import { useLocalSaves } from "@/context/saves-context";
import { useGetSavesQuery, useGetWannaBuyItemsQuery } from "@/store/routes/unified-commerce-api";
import { KeyAssistMark } from "@/components/ui/keyassist-logo";

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
  const { data: wannaBuyItems } = useGetWannaBuyItemsQuery(undefined, { skip: !token });
  const wannaBuyCount = token
    ? (wannaBuyItems?.filter((i) => !["cancelled", "expired"].includes(i.status)).length ?? 0)
    : 0;
  const savedCount = token ? (serverSaves?.length ?? 0) : localSavedIds.size;

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
      <Link href="/dashboard/wanna-buy" aria-label="Wanna Buy list" className={railBtn}>
        <ShoppingBag className="h-5 w-5" aria-hidden />
        {wannaBuyCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: "#059669" }}>
            {wannaBuyCount > 9 ? "9+" : wannaBuyCount}
          </span>
        )}
      </Link>
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

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 flex-row items-center justify-center border-t border-gray-200 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="flex w-full flex-1 items-center justify-between px-2 pb-[env(safe-area-inset-bottom)]">
          <NavContent />
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
        </div>
      </nav>
    </>
  );
}

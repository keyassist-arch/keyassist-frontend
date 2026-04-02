import Link from "next/link";
import { STORE_NAV_LINKS } from "@/lib/store-nav-links";

export function StoreSubNav() {
  return (
    <nav
      className="hidden w-full border-b bg-white lg:block"
      style={{ borderColor: "var(--shop-border)" }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-[var(--shop-layout-max)] flex-wrap items-center gap-3 px-4 py-3 sm:px-8">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          {STORE_NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-black/80 hover:text-shop-accent">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

import Link from "next/link";
import { siteContext } from "@/lib/site-context";

export function StoreTopBar() {
  return (
    <div className="w-full text-xs text-white" style={{ background: "var(--shop-dark)" }}>
      <div className="mx-auto flex max-w-[var(--shop-layout-max)] flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-8">
        <p className="max-w-3xl text-white/95">{siteContext.topBar.left}</p>
        <nav className="flex flex-wrap items-center gap-4 font-medium">
          <Link href="/dashboard" className="hover:underline">
            Track order
          </Link>
          <Link href="/faq" className="hover:underline">
            Help
          </Link>
          <Link href="/contact" className="hover:underline">
            Contact
          </Link>
        </nav>
      </div>
    </div>
  );
}

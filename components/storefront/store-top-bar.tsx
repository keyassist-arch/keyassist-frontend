import Link from "next/link";
import { siteContext } from "@/lib/site-context";

export function StoreTopBar() {
  return (
    <div className="w-full text-white" style={{ background: "var(--shop-primary-gradient)" }}>
      <div className="mx-auto flex max-w-[var(--shop-layout-max)] items-center justify-between gap-2 px-4 py-1.5 sm:px-8">
        <p className="text-xs font-medium text-white/90">{siteContext.topBar.left}</p>
        <nav className="hidden items-center gap-4 text-xs font-semibold sm:flex">
          <Link href="/dashboard" className="opacity-80 transition hover:opacity-100">Track order</Link>
          <Link href="/faq" className="opacity-80 transition hover:opacity-100">Help</Link>
          <Link href="/contact" className="opacity-80 transition hover:opacity-100">Contact</Link>
        </nav>
      </div>
    </div>
  );
}

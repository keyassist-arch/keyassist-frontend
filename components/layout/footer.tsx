import Link from "next/link";
import { siteContext } from "@/lib/site-context";
import { KeyAssistMark } from "@/components/ui/keyassist-logo";

const LINK_COLS = [
  {
    heading: "Pages",
    links: [
      { label: "Shop",  href: "/shop" },
      { label: "Cart",  href: "/cart" },
      { label: "Saves", href: "/saves" },
    ],
  },
  {
    heading: "Start selling",
    links: [
      { label: "For brands",     href: "/contact" },
      { label: "For creators",   href: "/contact" },
      { label: "Build your store", href: "/contact" },
    ],
  },
  {
    heading: "Information",
    links: [
      { label: "Shop Pay",   href: "/checkout" },
      { label: "Help center", href: "/faq" },
    ],
  },
  {
    heading: "Social",
    links: [
      { label: "X (Twitter)", href: "#" },
      { label: "Instagram",   href: "#" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy",   href: "#" },
    ],
  },
];

function AppBadge({ store }: { store: "apple" | "google" }) {
  return (
    <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50">
      {store === "apple" ? (
        <>
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-gray-800" aria-hidden>
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          App Store
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-gray-800" aria-hidden>
            <path d="M3.18 23.76c.32.17.69.19 1.04.06l11.29-6.52-2.47-2.47-9.86 8.93zM.5 1.52C.18 1.87 0 2.4 0 3.07v17.86c0 .67.18 1.2.5 1.55l.08.07 10-10v-.23L.58 1.45l-.08.07zM20.34 10.53l-2.85-1.65-2.76 2.76 2.76 2.76 2.88-1.66c.82-.47.82-1.24-.03-1.21zM4.22.18L15.51 6.7l-2.47 2.47L3.18.24C3.53.1 3.9.13 4.22.28V.18z" />
          </svg>
          Google Play
        </>
      )}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="w-full border-t border-gray-100 bg-white pb-20 pt-14 text-sm lg:pb-14 lg:pl-[84px]">
      <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[200px_1fr] lg:grid-cols-[220px_1fr]">
          {/* Brand + app download */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <KeyAssistMark size={34} />
              <p className="text-[20px] font-black tracking-tight text-gray-900">
                {siteContext.brand}
              </p>
            </div>
            <p className="max-w-[200px] text-[13px] leading-relaxed text-gray-500">
              {siteContext.brand} is the next step on our mission to make commerce better for everyone.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <AppBadge store="apple" />
              <AppBadge store="google" />
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {LINK_COLS.map((col) => (
              <div key={col.heading} className="space-y-3">
                <p className="text-[12px] font-bold text-gray-900">
                  {col.heading}
                </p>
                {col.links.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    className="block text-[13px] text-gray-500 transition hover:text-gray-900"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-3 border-t border-gray-100 pt-6 text-[12px] text-gray-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Powered by{" "}
            <Link href="/" className="font-semibold text-gray-600 hover:text-gray-900">
              Key Assist
            </Link>
            {" "}·{" "}
            <Link href="/contact" className="hover:text-gray-600">
              Start selling for free
            </Link>
          </p>
          <p>© Key Assist Inc. {new Date().getFullYear()}.</p>
        </div>
      </div>
    </footer>
  );
}

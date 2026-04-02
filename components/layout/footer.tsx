import Link from "next/link";
import { siteContext } from "@/lib/site-context";
import { OpenCartTrigger } from "@/components/cart/open-cart-trigger";

export function Footer() {
  return (
    <footer className="mt-0 w-full border-t py-14 text-sm text-white/80" style={{ background: "var(--shop-dark)", borderColor: "var(--shop-dark)" }}>
      <div className="mx-auto max-w-(--shop-layout-max) px-4 sm:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <p className="text-lg font-semibold text-white">{siteContext.brand}</p>
            <p className="max-w-xs text-sm text-white/70">{siteContext.tagline}</p>
            <p className="max-w-xs text-xs text-white/60">
              Connect marketplace listings into one storefront experience: discovery, cart, checkout, and order history.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">Quick links</p>
            <Link className="block text-sm text-white/70 hover:text-white" href="/">
              Home
            </Link>
            <Link className="block text-sm text-white/70 hover:text-white" href="/shop">
              Shop
            </Link>
            <OpenCartTrigger className="block w-full text-left text-sm text-white/70 hover:text-white">
              Cart
            </OpenCartTrigger>
            <Link className="block text-sm text-white/70 hover:text-white" href="/checkout">
              Checkout
            </Link>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">Your account</p>
            <Link className="block text-sm text-white/70 hover:text-white" href="/dashboard">
              Dashboard & orders
            </Link>
            <Link className="block text-sm text-white/70 hover:text-white" href="/faq">
              FAQ
            </Link>
            <Link className="block text-sm text-white/70 hover:text-white" href="/contact">
              Contact
            </Link>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-white">Support</p>
            <p className="text-sm text-white/70">help@unifiedcommerce.com</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {siteContext.brand}. All rights reserved.</p>
          <p className="text-white/50">Visa · Mastercard · Amex · PayPal — payment methods configured at checkout integration.</p>
        </div>
      </div>
    </footer>
  );
}

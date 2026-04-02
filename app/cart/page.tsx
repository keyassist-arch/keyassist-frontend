"use client";

import { Steps } from "@/components/ui/steps";
import { InnerShell } from "@/components/layout/inner-shell";
import { CartPanelBody } from "@/components/cart/cart-content";

export default function CartPage() {
  return (
    <InnerShell>
      <div className="space-y-6">
        <section className="card">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Cart</h1>
              <p className="mt-2 text-sm text-black/70">
                Full cart view. You can also open the cart anytime from the header.
              </p>
            </div>
            <Steps
              current={0}
              steps={[
                { label: "Cart", href: "/cart" },
                { label: "Checkout", href: "/checkout" },
                { label: "Success", href: "/checkout/success" },
              ]}
            />
          </div>
        </section>

        <CartPanelBody layout="page" />
      </div>
    </InnerShell>
  );
}

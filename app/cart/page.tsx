"use client";

import { Steps } from "@/components/ui/steps";
import { CartPanelBody } from "@/components/cart/cart-content";
import { PendingOrderBanner } from "@/components/cart/pending-order-banner";

export default function CartPage() {
  return (
    <div className="mx-auto max-w-(--shop-layout-max) px-4 py-10 sm:px-8 lg:px-24">
      <div className="mb-8">
        <Steps
          current={0}
          steps={[
            { label: "Cart", href: "/cart" },
            { label: "Checkout", href: "/checkout" },
            { label: "Success" },
          ]}
        />
      </div>

      <div className="mb-8 flex flex-col gap-1.5">
        <h1 className="text-[34px] font-extrabold tracking-[-0.8px] text-shop-ink">Your bag</h1>
      </div>

      <PendingOrderBanner />

      <div className="mt-2">
        <CartPanelBody layout="page" />
      </div>
    </div>
  );
}

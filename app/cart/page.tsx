"use client";

import Link from "next/link";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { CartPanelBody } from "@/components/cart/cart-content";
import { PendingOrderBanner } from "@/components/cart/pending-order-banner";

function CheckoutSteps({ current }: { current: number }) {
  const steps = ["Cart", "Checkout", "Complete"];
  return (
    <nav aria-label="Checkout steps" className="flex items-center gap-1.5">
      {steps.map((label, i) => (
        <span key={label} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-300" aria-hidden />}
          <span
            className={`text-sm font-medium ${
              i === current
                ? "text-gray-900"
                : i < current
                ? "text-gray-400 line-through"
                : "text-gray-400"
            }`}
          >
            {label}
          </span>
        </span>
      ))}
    </nav>
  );
}

export default function CartPage() {
  return (
    <div className="mx-auto max-w-(--shop-layout-max) px-4 py-8 sm:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-2xl"
            style={{ background: "rgba(92,74,230,0.1)" }}
          >
            <ShoppingBag className="h-5 w-5" style={{ color: "#059669" }} aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Your bag</h1>
          </div>
        </div>
        <CheckoutSteps current={0} />
      </div>

      <PendingOrderBanner />

      <div className="mt-2">
        <CartPanelBody layout="page" />
      </div>
    </div>
  );
}

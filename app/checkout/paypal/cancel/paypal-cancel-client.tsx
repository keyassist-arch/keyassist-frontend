"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { InnerShell } from "@/components/layout/inner-shell";
import { isUuid } from "@/lib/uuid";

export function PaypalCancelClient() {
  const searchParams = useSearchParams();
  const orderId = useMemo(() => {
    const r = (searchParams.get("order_id") ?? "").trim();
    return r && isUuid(r) ? r : "";
  }, [searchParams]);

  return (
    <InnerShell>
      <section className="card max-w-lg space-y-4">
        <h1 className="text-xl font-semibold">PayPal payment cancelled</h1>
        <p className="text-sm text-black/70">
          No charge was made. You can return to checkout and try again, or use another payment method.
        </p>
        {orderId ? (
          <p className="text-sm text-black/60">
            Your order is still <span className="font-medium">unpaid</span> — you can complete payment from checkout.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {orderId ? (
            <Link className="btn-primary" href={`/checkout?resume=${orderId}`}>
              Continue checkout
            </Link>
          ) : (
            <Link className="btn-primary" href="/checkout">
              Go to checkout
            </Link>
          )}
          <Link className="btn-secondary" href="/dashboard/orders">
            View orders
          </Link>
        </div>
      </section>
    </InnerShell>
  );
}

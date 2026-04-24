"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { InnerShell } from "@/components/layout/inner-shell";
import { isUuid } from "@/lib/uuid";

export function MyazaSuccessClient() {
  const searchParams = useSearchParams();
  const orderId = useMemo(() => {
    const r = (searchParams.get("order_id") ?? "").trim();
    return r && isUuid(r) ? r : "";
  }, [searchParams]);

  return (
    <InnerShell>
      <section className="card max-w-lg space-y-3">
        <h1 className="text-xl font-semibold">Returned from Myaza</h1>
        <p className="text-sm text-black/70">
          If you completed payment, your order status will update shortly. You can also open the order to watch for
          confirmation.
        </p>
        {orderId ? (
          <div className="flex flex-wrap gap-2">
            <Link className="btn-primary" href={`/checkout/success?order_id=${orderId}`}>
              Check payment status
            </Link>
            <Link className="btn-secondary" href={`/dashboard/orders/${orderId}`}>
              View order
            </Link>
          </div>
        ) : (
          <Link className="btn-primary" href="/dashboard/orders">
            View orders
          </Link>
        )}
      </section>
    </InnerShell>
  );
}

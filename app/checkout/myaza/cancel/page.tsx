"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { InnerShell } from "@/components/layout/inner-shell";
import { isUuid } from "@/lib/uuid";

export default function CheckoutMyazaCancelPage() {
  const searchParams = useSearchParams();
  const orderId = useMemo(() => {
    const r = (searchParams.get("order_id") ?? "").trim();
    return r && isUuid(r) ? r : "";
  }, [searchParams]);

  return (
    <InnerShell>
      <section className="card max-w-lg space-y-3">
        <h1 className="text-xl font-semibold">Myaza session cancelled</h1>
        <p className="text-sm text-black/70">You can return to checkout to pick another way to pay or try again.</p>
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
        </div>
      </section>
    </InnerShell>
  );
}

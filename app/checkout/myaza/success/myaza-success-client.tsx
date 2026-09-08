"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { InnerShell } from "@/components/layout/inner-shell";
import { isUuid, isValidOrderIdentifier } from "@/lib/uuid";

export function MyazaSuccessClient() {
  const searchParams = useSearchParams();
  const orderId = useMemo(() => {
    const r = (searchParams.get("order_id") ?? "").trim();
    return r && isValidOrderIdentifier(r) ? r : "";
  }, [searchParams]);

  return (
    <InnerShell>
      <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center py-8 text-center">
        <section className="card w-full space-y-6 p-8 sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-8 ring-emerald-50/50">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-shop-ink">Returned from Myaza</h1>
            <p className="text-sm text-shop-muted leading-relaxed">
              If you completed payment, your order status will update shortly. You can check the live status or view your order details.
            </p>
          </div>
          {orderId ? (
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link className="btn-primary flex-1 inline-flex items-center justify-center gap-2 py-3" href={`/checkout/success?order_id=${orderId}`}>
                Check payment status
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link className="btn-secondary flex-1 inline-flex items-center justify-center gap-2 py-3" href={`/dashboard/orders/${orderId}`}>
                View order
              </Link>
            </div>
          ) : (
            <div className="pt-2">
              <Link className="btn-primary inline-flex items-center justify-center gap-2 w-full py-3" href="/dashboard/orders">
                View orders
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>
      </div>
    </InnerShell>
  );
}

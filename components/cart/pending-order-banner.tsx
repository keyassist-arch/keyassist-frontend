"use client";

import Link from "next/link";
import { useGetPendingPaymentQuery } from "@/store/routes/unified-commerce-api";
import { useAppSelector } from "@/store/hooks";

export function PendingOrderBanner() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data } = useGetPendingPaymentQuery(undefined, { skip: !token });
  const pendingId = data?.order?.id ?? null;

  if (!pendingId) return null;

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p>
        <span className="font-semibold">You have an unpaid order.</span>{" "}
        <Link href={`/checkout?resume=${pendingId}`} className="font-medium text-shop-accent underline underline-offset-2">
          Continue checkout
        </Link>{" "}
        or{" "}
        <Link href={`/dashboard/orders/${pendingId}`} className="font-medium text-shop-accent underline underline-offset-2">
          view the order
        </Link>
        . Your cart may be empty because the order already used those items.
      </p>
    </div>
  );
}

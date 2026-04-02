import { Suspense } from "react";
import { CheckoutSuccessClient } from "./checkout-success-client";
import { InnerShell } from "@/components/layout/inner-shell";
import { LoadingState } from "@/components/feedback/query-state";

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <InnerShell>
          <LoadingState label="Loading…" />
        </InnerShell>
      }
    >
      <CheckoutSuccessClient />
    </Suspense>
  );
}

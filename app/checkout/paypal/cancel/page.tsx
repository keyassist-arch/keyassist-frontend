import { Suspense } from "react";
import { InnerShell } from "@/components/layout/inner-shell";
import { LoadingState } from "@/components/feedback/query-state";
import { PaypalCancelClient } from "./paypal-cancel-client";

export default function CheckoutPaypalCancelPage() {
  return (
    <Suspense
      fallback={
        <InnerShell>
          <LoadingState label="Loading…" />
        </InnerShell>
      }
    >
      <PaypalCancelClient />
    </Suspense>
  );
}

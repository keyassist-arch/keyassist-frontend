import { Suspense } from "react";
import { InnerShell } from "@/components/layout/inner-shell";
import { LoadingState } from "@/components/feedback/query-state";
import { PaypalSuccessClient } from "./paypal-success-client";

export default function CheckoutPaypalSuccessPage() {
  return (
    <Suspense
      fallback={
        <InnerShell>
          <LoadingState label="Loading…" />
        </InnerShell>
      }
    >
      <PaypalSuccessClient />
    </Suspense>
  );
}

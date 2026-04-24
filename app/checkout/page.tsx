import { Suspense } from "react";
import { CheckoutClient } from "./checkout-client";
import { InnerShell } from "@/components/layout/inner-shell";
import { LoadingState } from "@/components/feedback/query-state";

function CheckoutLoading() {
  return (
    <InnerShell>
      <LoadingState label="Loading checkout…" />
    </InnerShell>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutClient />
    </Suspense>
  );
}

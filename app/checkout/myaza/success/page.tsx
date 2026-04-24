import { Suspense } from "react";
import { InnerShell } from "@/components/layout/inner-shell";
import { LoadingState } from "@/components/feedback/query-state";
import { MyazaSuccessClient } from "./myaza-success-client";

export default function CheckoutMyazaSuccessPage() {
  return (
    <Suspense
      fallback={
        <InnerShell>
          <LoadingState label="Loading…" />
        </InnerShell>
      }
    >
      <MyazaSuccessClient />
    </Suspense>
  );
}

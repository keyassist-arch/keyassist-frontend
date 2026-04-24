import { Suspense } from "react";
import { InnerShell } from "@/components/layout/inner-shell";
import { LoadingState } from "@/components/feedback/query-state";
import { MyazaCancelClient } from "./myaza-cancel-client";

export default function CheckoutMyazaCancelPage() {
  return (
    <Suspense
      fallback={
        <InnerShell>
          <LoadingState label="Loading…" />
        </InnerShell>
      }
    >
      <MyazaCancelClient />
    </Suspense>
  );
}

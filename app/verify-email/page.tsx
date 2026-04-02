import { Suspense } from "react";
import { VerifyEmailClient } from "./verify-email-client";
import { InnerShell } from "@/components/layout/inner-shell";
import { LoadingState } from "@/components/feedback/query-state";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <InnerShell>
          <LoadingState label="Loading…" />
        </InnerShell>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}

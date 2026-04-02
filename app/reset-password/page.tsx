import { Suspense } from "react";
import { ResetPasswordClient } from "./reset-password-client";
import { InnerShell } from "@/components/layout/inner-shell";
import { LoadingState } from "@/components/feedback/query-state";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <InnerShell>
          <LoadingState label="Loading…" />
        </InnerShell>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { TrackPageClient } from "./track-page-client";
import { InnerShell } from "@/components/layout/inner-shell";
import { LoadingState } from "@/components/feedback/query-state";

export const metadata: Metadata = {
  title: "Track Order | Key Assist",
  description: "Track the real-time shipping and delivery status of your Key Assist order.",
};

export default function TrackPage() {
  return (
    <Suspense
      fallback={
        <InnerShell>
          <div className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center py-12">
            <LoadingState label="Loading tracking portal…" />
          </div>
        </InnerShell>
      }
    >
      <TrackPageClient />
    </Suspense>
  );
}

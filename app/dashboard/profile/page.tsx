"use client";

import { useState } from "react";
import { ProfileTabList, ProfileTabPanels } from "@/components/dashboard/profile-tab-panels";
import { LoadingState } from "@/components/feedback/query-state";
import { useGetMeQuery } from "@/store/routes/unified-commerce-api";
import { useAppSelector } from "@/store/hooks";

type TabId = "personal" | "shipping" | "payments";

export default function DashboardProfilePage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: me, isLoading, isError } = useGetMeQuery(undefined, { skip: !token });
  const [tab, setTab] = useState<TabId>("personal");

  if (isLoading && !me) {
    return <LoadingState label="Loading profile…" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-shop-ink">Profile</h1>
        <p className="mt-1 text-sm text-black/70">
          Manage personal details, shipping, and saved payment methods (Stripe &amp; PayPal).
        </p>
        {isError ? (
          <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200/80 px-3 py-2">
            Could not sync account from the server — showing sample data until the API is available.
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-shop-border/80 bg-white">
        <ProfileTabList active={tab} onTabChange={setTab} />
        <div className="p-4 sm:p-6">
          <ProfileTabPanels me={me} active={tab} />
        </div>
      </div>
    </div>
  );
}

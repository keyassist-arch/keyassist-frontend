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

  if (isLoading && !me) return <LoadingState label="Loading profile…" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your personal details, shipping addresses, and payment methods.
        </p>
        {isError && (
          <p className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
            We couldn&apos;t load your account details. Some information may be out of date.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        {/* Tab strip */}
        <div className="border-b border-gray-100 px-3 pt-3">
          <ProfileTabList active={tab} onTabChange={setTab} />
        </div>
        {/* Tab content */}
        <div className="p-5">
          <ProfileTabPanels me={me} active={tab} />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAppSelector } from "@/store/hooks";
import {
  useGetIssuesQuery,
  usePatchIssueMutation,
  useResolveWithRefundMutation,
} from "@/store/routes/unified-commerce-api";
import type { IssueStatus } from "@/types/api";
import { ErrorState, SuccessState } from "@/components/feedback/query-state";
import { AdminListSkeleton } from "@/components/dashboard/admin-list-skeleton";
import { getErrorMessage } from "@/lib/rtk-error";

export default function AdminIssuesPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: issues, isLoading, isError, error } = useGetIssuesQuery(undefined, { skip: !token });
  const [patchIssue, { isLoading: patchingIssue }] = usePatchIssueMutation();
  const [resolveWithRefund, { isLoading: resolvingIssue }] = useResolveWithRefundMutation();
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  if (isLoading) return <AdminListSkeleton />;
  if (isError) return <ErrorState error={error} title="Could not load issues" />;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Customer issues</h1>
        <p className="mt-1 text-sm text-gray-500">
          {issues?.length ?? 0} {issues?.length === 1 ? "issue" : "issues"} — manage status and resolutions.
        </p>
      </section>

      {notice?.ok && <SuccessState message={notice.text} />}
      {notice && !notice.ok && <ErrorState error={notice.text} title="Operation failed" />}

      {(!issues || issues.length === 0) ? (
        <section className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
          <p className="text-sm text-gray-500">No issues reported yet.</p>
        </section>
      ) : (
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {(issues ?? []).map((issue) => (
              <div key={issue.id} className="rounded-xl border border-gray-100 p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{issue.subject}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{issue.id}</p>
                    {issue.userId && (
                      <p className="text-xs text-gray-400 mt-0.5">User: <span className="font-mono">{issue.userId}</span></p>
                    )}
                  </div>
                  <StatusBadge status={issue.status} />
                </div>
                <p className="text-sm text-gray-600">{issue.description}</p>
                <div className="flex flex-wrap gap-2 items-center">
                  <label className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500">Status</span>
                    <select
                      className="rounded-full border border-gray-200 px-3 py-1.5 text-sm outline-none transition focus:border-[#059669]"
                      value={issue.status}
                      disabled={patchingIssue}
                      onChange={async (e) => {
                        setNotice(null);
                        try {
                          await patchIssue({ id: issue.id, body: { status: e.target.value as IssueStatus } }).unwrap();
                          setNotice({ ok: true, text: "Issue updated." });
                        } catch (err) {
                          setNotice({ ok: false, text: getErrorMessage(err) });
                        }
                      }}
                    >
                      {(["OPEN", "IN_PROGRESS", "AWAITING_CUSTOMER", "RESOLVED", "CLOSED"] as IssueStatus[]).map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="rounded-full border border-gray-200 px-4 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                    disabled={resolvingIssue}
                    onClick={async () => {
                      const amount = window.prompt("Refund amount (e.g. 49.99):");
                      if (!amount) return;
                      setNotice(null);
                      try {
                        await resolveWithRefund({ id: issue.id, body: { amount, reason: issue.subject } }).unwrap();
                        setNotice({ ok: true, text: "Issue resolved with refund." });
                      } catch (err) {
                        setNotice({ ok: false, text: getErrorMessage(err) });
                      }
                    }}
                  >
                    {resolvingIssue ? "Processing…" : "Resolve + refund"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

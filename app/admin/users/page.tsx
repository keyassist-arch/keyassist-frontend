"use client";

import { useState } from "react";
import { FormEvent } from "react";
import { useAppSelector } from "@/store/hooks";
import {
  useGetAdminUsersQuery,
  useCreateAdminUserMutation,
  usePatchAdminUserMutation,
} from "@/store/routes/unified-commerce-api";
import { ErrorState, SuccessState } from "@/components/feedback/query-state";
import { AdminListSkeleton } from "@/components/dashboard/admin-list-skeleton";
import { getErrorMessage } from "@/lib/rtk-error";
import type { AdminPermission, AdminUserResponse } from "@/types/api";

const PERMISSION_OPTIONS: { value: AdminPermission; label: string }[] = [
  { value: "ORDERS", label: "Orders" },
  { value: "PRODUCTS", label: "Products" },
  { value: "REFUNDS", label: "Refunds" },
  { value: "ISSUES", label: "Issues" },
  { value: "SHIPPING_RATES", label: "Shipping rates" },
];

function PermissionCheckboxes({
  selected,
  onChange,
}: {
  selected: AdminPermission[];
  onChange: (next: AdminPermission[]) => void;
}) {
  const toggle = (perm: AdminPermission) => {
    onChange(
      selected.includes(perm) ? selected.filter((p) => p !== perm) : [...selected, perm],
    );
  };
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {PERMISSION_OPTIONS.map((opt) => (
        <label
          key={opt.value}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700"
        >
          <input
            type="checkbox"
            checked={selected.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            className="h-3.5 w-3.5 rounded border-gray-300 text-[#059669] focus:ring-[#059669]"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function AdminUserRow({ user }: { user: AdminUserResponse }) {
  const [patchAdminUser, { isLoading: patching }] = usePatchAdminUserMutation();
  const [editing, setEditing] = useState(false);
  const [draftPermissions, setDraftPermissions] = useState<AdminPermission[]>(user.permissions);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const isSuper = user.role === "ADMIN_SUPER";
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  const savePermissions = async () => {
    setNotice(null);
    try {
      await patchAdminUser({ id: user.id, body: { permissions: draftPermissions } }).unwrap();
      setEditing(false);
    } catch (err) {
      setNotice({ ok: false, text: getErrorMessage(err) });
    }
  };

  const toggleDisabled = async () => {
    setNotice(null);
    try {
      await patchAdminUser({ id: user.id, body: { disabled: !user.disabled } }).unwrap();
    } catch (err) {
      setNotice({ ok: false, text: getErrorMessage(err) });
    }
  };

  return (
    <div className="rounded-xl border border-gray-100 p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900">{displayName}</p>
          <p className="truncate text-xs text-gray-400">{user.email}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              isSuper ? "bg-purple-50 text-purple-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            {isSuper ? "Super admin" : "Staff"}
          </span>
          {user.disabled && (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">
              Disabled
            </span>
          )}
        </div>
      </div>

      {!isSuper && (
        <>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {user.permissions.length === 0 && (
              <span className="text-xs text-gray-400">No screens granted yet</span>
            )}
            {user.permissions.map((p) => (
              <span key={p} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600">
                {PERMISSION_OPTIONS.find((o) => o.value === p)?.label ?? p}
              </span>
            ))}
          </div>

          {notice && !notice.ok && (
            <div className="mt-3">
              <ErrorState error={notice.text} title="Update failed" />
            </div>
          )}

          {editing ? (
            <div className="mt-4 space-y-3">
              <PermissionCheckboxes selected={draftPermissions} onChange={setDraftPermissions} />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={savePermissions}
                  disabled={patching}
                  className="rounded-full bg-[#059669] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {patching ? "Saving…" : "Save permissions"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDraftPermissions(user.permissions);
                    setEditing(false);
                  }}
                  className="rounded-full border border-gray-200 px-4 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="text-xs font-semibold text-[#059669] hover:underline"
              >
                Edit permissions
              </button>
              <button
                type="button"
                onClick={toggleDisabled}
                disabled={patching}
                className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-50"
              >
                {user.disabled ? "Re-enable" : "Disable"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: adminUsers, isLoading, isError, error } = useGetAdminUsersQuery(undefined, { skip: !token });
  const [createAdminUser, { isLoading: inviting }] = useCreateAdminUserMutation();

  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const onInvite = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("invite_email") ?? "").trim();
    const firstName = String(fd.get("invite_firstName") ?? "").trim();
    const lastName = String(fd.get("invite_lastName") ?? "").trim();
    if (!email || !firstName || !lastName) return;
    setNotice(null);
    try {
      await createAdminUser({ email, firstName, lastName, permissions }).unwrap();
      setNotice({ ok: true, text: `Invite sent to ${email}.` });
      (e.target as HTMLFormElement).reset();
      setPermissions([]);
    } catch (err) {
      setNotice({ ok: false, text: getErrorMessage(err) });
    }
  };

  if (isLoading) return <AdminListSkeleton />;
  if (isError) return <ErrorState error={error} title="Could not load admin users" />;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">Team</h1>
        <p className="mt-1 text-sm text-gray-500">
          Invite admin staff and choose exactly which screens each one can access.
        </p>
      </section>

      {notice?.ok && <SuccessState message={notice.text} />}
      {notice && !notice.ok && <ErrorState error={notice.text} title="Invite failed" />}

      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Invite admin</h2>
        <form className="mt-4 space-y-4" onSubmit={onInvite}>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block space-y-1 text-xs">
              <span className="font-medium text-gray-500">Email</span>
              <input
                className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10"
                name="invite_email"
                type="email"
                placeholder="name@example.com"
                required
              />
            </label>
            <label className="block space-y-1 text-xs">
              <span className="font-medium text-gray-500">First name</span>
              <input
                className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10"
                name="invite_firstName"
                required
              />
            </label>
            <label className="block space-y-1 text-xs">
              <span className="font-medium text-gray-500">Last name</span>
              <input
                className="w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/10"
                name="invite_lastName"
                required
              />
            </label>
          </div>

          <div>
            <span className="text-xs font-medium text-gray-500">Screens this admin can access</span>
            <div className="mt-2">
              <PermissionCheckboxes selected={permissions} onChange={setPermissions} />
            </div>
          </div>

          <button
            type="submit"
            disabled={inviting}
            className="rounded-full bg-[#059669] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {inviting ? "Sending invite…" : "Send invite"}
          </button>
        </form>
      </section>

      {(adminUsers ?? []).length > 0 && (
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Admin users</h2>
          <div className="mt-4 space-y-3">
            {(adminUsers ?? []).map((user) => (
              <AdminUserRow key={user.id} user={user} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

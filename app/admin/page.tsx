"use client";

import { useGetAdminOrdersQuery, useGetAdminProductsQuery, useGetMeQuery } from "@/store/routes/unified-commerce-api";
import { useAppSelector } from "@/store/hooks";
import { LoadingState } from "@/components/feedback/query-state";

export default function AdminOverviewPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: me } = useGetMeQuery(undefined, { skip: !token });
  const { data: adminOrders, isLoading: ordLoading } = useGetAdminOrdersQuery(undefined, { skip: !token });
  const { data: adminProducts, isLoading: prodLoading } = useGetAdminProductsQuery(undefined, { skip: !token });

  const isAdmin = me?.role === "ADMIN_SUPER" || me?.role === "ADMIN_STAFF";
  const loading = ordLoading || prodLoading;

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Admin</h1>
        <p className="mt-1 text-sm text-gray-500">Manage orders, review catalog entries, and handle customer issues.</p>
      </section>

      {loading && <LoadingState label="Loading…" />}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700">Catalog items</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{adminProducts?.length ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700">Orders</h2>
          <p className="mt-2 text-3xl font-bold text-gray-900">{adminOrders?.length ?? 0}</p>
        </article>
        <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700">Role</h2>
          <p className="mt-2 text-sm font-medium text-gray-600">
            {me?.role === "ADMIN_SUPER" ? "Super admin" : me?.role === "ADMIN_STAFF" ? "Staff" : me?.role}
          </p>
        </article>
      </section>

      {(adminOrders ?? []).length > 0 && (
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Recent orders</h2>
          <div className="mt-4 space-y-3">
            {(adminOrders ?? []).slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3 text-sm">
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {order.items[0]?.images?.[0] ? (
                    <img src={order.items[0].images[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-300">
                      —
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-gray-400 font-mono">{order.id}</p>
                  {order.userEmail && (
                    <p className="truncate text-gray-700">{order.userEmail}</p>
                  )}
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {order.status.replaceAll("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

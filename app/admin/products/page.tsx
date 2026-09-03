"use client";

import { useId, useState } from "react";
import { FormEvent } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import {
  useGetAdminProductsQuery,
  usePostAdminScrapePreviewMutation,
  useDeleteAdminProductMutation,
} from "@/store/routes/unified-commerce-api";
import { ErrorState, SuccessState } from "@/components/feedback/query-state";
import { AdminListSkeleton } from "@/components/dashboard/admin-list-skeleton";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { getErrorMessage } from "@/lib/rtk-error";

export default function AdminProductsPage() {
  const token = useAppSelector((s) => s.auth.accessToken);
  const { data: adminProducts, isLoading, isError, error } = useGetAdminProductsQuery(undefined, { skip: !token });
  const [scrapePreview, { isLoading: scraping, isError: scrapeErr, error: scrapeError }] =
    usePostAdminScrapePreviewMutation();
  const [deleteProduct, { isLoading: deleting }] = useDeleteAdminProductMutation();

  const [previewUrl, setPreviewUrl] = useState("");
  const [previewJson, setPreviewJson] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const previewUrlFieldId = useId();

  const onScrapePreview = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPreviewJson(null);
    const u = previewUrl.trim();
    if (!u) return;
    try {
      const data = await scrapePreview({ url: u }).unwrap();
      setPreviewJson(JSON.stringify(data, null, 2));
    } catch {
      /* scrapeErr */
    }
  };

  const onDelete = async () => {
    const target = confirmDelete;
    if (!target) return;
    setNotice(null);
    try {
      await deleteProduct(target.id).unwrap();
      setNotice({ ok: true, text: `"${target.title}" deleted.` });
    } catch (err) {
      setNotice({ ok: false, text: getErrorMessage(err) });
    }
    setConfirmDelete(null);
  };

  if (isLoading) return <AdminListSkeleton />;
  if (isError) return <ErrorState error={error} title="Could not load products" />;

  return (
    <>
      <div className="space-y-6">
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-shop-border bg-white p-6 shadow-sm">
          <div>
            <h1 className="text-xl font-semibold text-shop-ink">Products</h1>
            <p className="mt-1 text-sm text-shop-muted">
              {adminProducts?.length ?? 0} catalog items. Preview a product from any URL to see how it imports.
            </p>
          </div>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ background: "var(--shop-primary)" }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add product
          </Link>
        </section>

        {notice?.ok && <SuccessState message={notice.text} />}
        {notice && !notice.ok && <ErrorState error={notice.text} title="Delete failed" />}

        <section className="rounded-2xl border border-shop-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-shop-ink">Product preview</h2>
          <p className="mt-1 text-xs text-shop-muted">
            Preview a product from any URL. Nothing is saved to the catalog until you import it from the storefront.
          </p>
          <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onScrapePreview}>
            <label htmlFor={previewUrlFieldId} className="min-w-0 flex-1 space-y-1 text-sm">
              <span className="text-shop-muted">Product URL</span>
              <input
                id={previewUrlFieldId}
                className="w-full rounded-full border border-shop-border px-4 py-2.5 text-sm outline-none transition placeholder:text-shop-muted focus:border-shop-primary focus:ring-2 focus:ring-shop-primary/10"
                value={previewUrl}
                onChange={(e) => setPreviewUrl(e.target.value)}
                placeholder="https://..."
              />
            </label>
            <button
              type="submit"
              className="rounded-full border border-shop-border px-6 py-2.5 text-sm font-medium text-shop-ink transition hover:bg-(--background) disabled:opacity-50 shrink-0"
              disabled={scraping}
            >
              {scraping ? "Fetching…" : "Run preview"}
            </button>
          </form>
          {scrapeErr ? (
            <div className="mt-4">
              <ErrorState error={scrapeError} title="Preview failed" />
            </div>
          ) : null}
          {previewJson ? (
            <pre className="mt-4 max-h-80 overflow-auto rounded-xl border border-shop-border bg-(--background) p-4 text-xs">
              {previewJson}
            </pre>
          ) : null}
        </section>

        {(adminProducts ?? []).length > 0 && (
          <section className="rounded-2xl border border-shop-border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-shop-ink">All catalog items</h2>
            <div className="mt-4 space-y-2">
              {(adminProducts ?? []).map((product) => (
                <div key={product.id} className="flex items-center gap-4 rounded-xl border border-shop-border px-4 py-3 text-sm">
                  <Link href={`/products/${product.slug ?? product.id}`} className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-(--background)">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-shop-muted">
                          —
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-shop-ink hover:text-shop-primary transition-colors">{product.title}</p>
                      <p className="truncate text-xs text-shop-muted font-mono">{product.id}</p>
                    </div>
                  </Link>
                  {product.salePrice && (
                    <span className="shrink-0 text-sm font-medium text-shop-ink">
                      {product.currency} {product.salePrice}
                    </span>
                  )}
                  <Link
                    href={`/admin/products/${product.id}`}
                    className="shrink-0 rounded-full p-2 text-shop-muted transition hover:bg-(--background) hover:text-shop-ink"
                    aria-label={`Edit ${product.title}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete({ id: product.id, title: product.title })}
                    disabled={deleting}
                    className="shrink-0 rounded-full p-2 text-shop-muted transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    aria-label={`Delete ${product.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete != null}
        title="Delete product"
        description={`Are you sure you want to delete "${confirmDelete?.title ?? ""}"? This cannot be undone.`}
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        confirmDisabled={deleting}
        danger
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  );
}

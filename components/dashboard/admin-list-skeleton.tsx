import { Skeleton } from "@/components/ui/skeleton";

/** Generic header-card + row-list placeholder shared by the admin orders/batches/products/refunds/issues/team pages. */
export function AdminListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-sm">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-72" />
      </section>

      <div className="space-y-4">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
            <div className="mt-4 flex gap-2 border-t border-black/[0.05] pt-4">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

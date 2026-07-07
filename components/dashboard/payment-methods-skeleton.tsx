import { Skeleton } from "@/components/ui/skeleton";

export function PaymentMethodsSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <ul className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <li key={i} className="flex items-center gap-4 rounded-2xl border border-gray-100 p-4">
          <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

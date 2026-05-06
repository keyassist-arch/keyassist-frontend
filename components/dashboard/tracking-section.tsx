import { Package } from "lucide-react";
import type { TrackingEntry } from "@/types/api";

function formatDate(iso?: string | null) {
  if (!iso) return undefined;
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function TrackingSection({ tracking }: { tracking: TrackingEntry[] | undefined }) {
  if (!Array.isArray(tracking) || tracking.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/15 bg-black/[0.02] p-6 text-center">
        <Package className="mx-auto h-8 w-8 text-black/25" aria-hidden />
        <p className="mt-3 text-sm text-black/60">No tracking updates yet. Check back when your order ships.</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-0 border-l border-shop-border pl-6">
      {tracking.map((entry, i) => {
        const carrierNum = [entry.carrier, entry.trackingNumber].filter(Boolean).join(" · ");
        const title = carrierNum || entry.status || "Shipment update";
        const statusDate = [entry.status, formatDate(entry.createdAt)].filter(Boolean).join(" · ");
        return (
          <li key={entry.id ?? i} className="relative pb-8 last:pb-0">
            <span className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full border-2 border-shop-accent bg-white" />
            <p className="font-medium text-shop-ink">{title}</p>
            {statusDate ? <p className="mt-0.5 text-sm text-black/60">{statusDate}</p> : null}
            {entry.message ? <p className="mt-1 text-sm text-black/70">{entry.message}</p> : null}
          </li>
        );
      })}
    </ol>
  );
}

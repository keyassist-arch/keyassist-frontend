import { Package } from "lucide-react";

function describeEntry(entry: unknown): { title: string; subtitle?: string } {
  if (entry && typeof entry === "object") {
    const o = entry as Record<string, unknown>;
    const carrier = typeof o.carrier === "string" ? o.carrier : undefined;
    const num = typeof o.trackingNumber === "string" ? o.trackingNumber : undefined;
    const status = typeof o.trackingStatus === "string" ? o.trackingStatus : typeof o.status === "string" ? o.status : undefined;
    const at = typeof o.at === "string" ? o.at : typeof o.date === "string" ? o.date : undefined;
    if (carrier || num || status) {
      return {
        title: [carrier, num].filter(Boolean).join(" · ") || status || "Shipment update",
        subtitle: [status, at].filter(Boolean).join(" · ") || undefined,
      };
    }
  }
  return { title: typeof entry === "string" ? entry : "Update", subtitle: undefined };
}

export function TrackingSection({ tracking }: { tracking: unknown }) {
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
        const { title, subtitle } = describeEntry(entry);
        return (
          <li key={i} className="relative pb-8 last:pb-0">
            <span className="absolute -left-[25px] top-1.5 h-3 w-3 rounded-full border-2 border-shop-accent bg-white" />
            <p className="font-medium text-shop-ink">{title}</p>
            {subtitle ? <p className="mt-0.5 text-sm text-black/60">{subtitle}</p> : null}
            {entry && typeof entry === "object" && Object.keys(entry as object).length > 0 && !subtitle ? (
              <pre className="mt-2 max-h-32 overflow-auto rounded bg-black/[0.03] p-2 text-[11px] leading-relaxed text-black/70">
                {JSON.stringify(entry, null, 2)}
              </pre>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

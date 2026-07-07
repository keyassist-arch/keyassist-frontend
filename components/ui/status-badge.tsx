import type { Order } from "@/types";
import { Badge } from "@/components/ui/badge";
import { orderStatusStyle } from "@/lib/order-status-styles";

type BadgeVariant = "success" | "warning" | "info" | "neutral" | "danger";

/** Fallback bucketing for statuses outside the `OrderStatus` enum (refunds, issues). */
function variantForStatus(status: string): BadgeVariant {
  const s = status.toLowerCase();
  switch (s) {
    case "succeeded":
    case "resolved":
      return "success";
    case "manual_required":
    case "awaiting_customer":
    case "open":
      return "warning";
    case "in_progress":
      return "info";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

const dotColor: Record<BadgeVariant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
  neutral: "bg-gray-400",
  danger: "bg-rose-500",
};

/** Works with mock `Order["status"]` labels and API `OrderStatus` / `RefundStatus` / `IssueStatus` enums. */
export function StatusBadge({ status }: { status: Order["status"] | string }) {
  const raw = String(status);
  const label = typeof status === "string" ? status.replaceAll("_", " ") : status;

  // Order statuses get the richer, order-specific palette shared with the admin orders list.
  const orderStyle = orderStatusStyle(raw);
  if (orderStyle) {
    return (
      <span
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${orderStyle.bg} ${orderStyle.border} ${orderStyle.text}`}
      >
        <span className={`mr-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${orderStyle.dot}`} aria-hidden />
        {label}
      </span>
    );
  }

  const variant = variantForStatus(raw);
  return (
    <Badge variant={variant}>
      <span className={`mr-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dotColor[variant]}`} aria-hidden />
      {label}
    </Badge>
  );
}

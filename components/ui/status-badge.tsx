import type { Order } from "@/types";
import { Badge } from "@/components/ui/badge";

type BadgeVariant = "success" | "warning" | "neutral" | "danger";

function variantForStatus(status: string): BadgeVariant {
  const s = status.toLowerCase();
  switch (s) {
    case "delivered":
    case "paid":
    case "refunded":
      return "success";
    case "processing":
    case "ordered_from_supplier":
    case "pending":
      return "warning";
    case "shipped":
      return "neutral";
    case "cancelled":
    case "disputed":
      return "danger";
    default:
      return "neutral";
  }
}

const dotColor: Record<BadgeVariant, string> = {
  success: "bg-indigo-500",
  warning: "bg-amber-500",
  neutral: "bg-black/30",
  danger: "bg-rose-500",
};

/** Works with mock `Order["status"]` labels and API `OrderStatus` enums. */
export function StatusBadge({ status }: { status: Order["status"] | string }) {
  const variant = variantForStatus(String(status));
  const label = typeof status === "string" ? status.replaceAll("_", " ") : status;
  return (
    <Badge variant={variant}>
      <span className={`mr-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dotColor[variant]}`} aria-hidden />
      {label}
    </Badge>
  );
}

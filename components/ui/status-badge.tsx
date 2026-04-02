import type { Order } from "@/types";
import { Badge } from "@/components/ui/badge";

function variantForStatus(status: string): "success" | "warning" | "neutral" | "danger" {
  const s = status.toLowerCase();
  switch (s) {
    case "delivered":
    case "paid":
      return "success";
    case "processing":
    case "ordered_from_supplier":
    case "pending":
      return "warning";
    case "shipped":
      return "neutral";
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
}

/** Works with mock `Order["status"]` labels and API `OrderStatus` enums. */
export function StatusBadge({ status }: { status: Order["status"] | string }) {
  const label = typeof status === "string" ? status.replaceAll("_", " ") : status;
  return <Badge variant={variantForStatus(String(status))}>{label}</Badge>;
}

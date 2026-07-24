import {
  LayoutDashboard,
  Package,
  AlertCircle,
  Banknote,
  Box,
  Users,
  Inbox,
  type LucideIcon,
} from "lucide-react";
import type { AdminPermission, MeResponse } from "@/types/api";

export type AdminNavPermission = AdminPermission | "SUPER_ONLY" | null;

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  end: boolean;
  permission: AdminNavPermission;
  description: string;
};

export const ADMIN_NAV: readonly AdminNavItem[] = [
  { href: "/admin",          label: "Overview", icon: LayoutDashboard, end: true,  permission: null,          description: "Dashboard home" },
  { href: "/admin/orders",   label: "Orders",    icon: Package,        end: false, permission: "ORDERS",     description: "Track and update order status" },
  { href: "/admin/products", label: "Products",  icon: Box,            end: false, permission: "PRODUCTS",   description: "Manage the catalog" },
  { href: "/admin/manual-imports", label: "Manual requests", icon: Inbox, end: false, permission: "PRODUCTS", description: "Fulfill customer-submitted manual product requests" },
  { href: "/admin/refunds",  label: "Refunds",   icon: Banknote,       end: false, permission: "REFUNDS",    description: "Issue and track refunds" },
  { href: "/admin/issues",   label: "Issues",    icon: AlertCircle,    end: false, permission: "ISSUES",     description: "Resolve customer disputes" },
  { href: "/admin/users",    label: "Team",      icon: Users,          end: false, permission: "SUPER_ONLY", description: "Manage staff access" },
];

export function canSeeAdminSection(me: MeResponse | undefined, permission: AdminNavPermission): boolean {
  if (permission === null) return true;
  if (me?.role === "ADMIN_SUPER") return true;
  if (permission === "SUPER_ONLY") return false;
  return !!me?.permissions?.includes(permission);
}

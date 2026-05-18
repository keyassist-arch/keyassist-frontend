import type { Metadata } from "next";
import { AdminDashboardShell } from "@/components/dashboard/admin-dashboard-shell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}

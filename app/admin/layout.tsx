import { AdminDashboardShell } from "@/components/dashboard/admin-dashboard-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminDashboardShell>{children}</AdminDashboardShell>;
}

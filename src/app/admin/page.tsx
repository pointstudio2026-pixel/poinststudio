import { redirect } from "next/navigation";
import { requireSessionOrRedirect } from "@/shared/auth/session";
import { AdminDashboardView } from "@/features/admin/AdminDashboardView";

export default async function AdminPage() {
  const session = await requireSessionOrRedirect();
  if (session.role !== "admin") {
    redirect("/dashboard");
  }

  return <AdminDashboardView />;
}

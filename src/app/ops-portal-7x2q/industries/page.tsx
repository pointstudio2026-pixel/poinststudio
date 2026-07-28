import { redirect } from "next/navigation";
import { requireSessionOrRedirect } from "@/shared/auth/session";
import { IndustriesAdminView } from "@/features/admin/IndustriesAdminView";

export default async function IndustriesAdminPage() {
  const session = await requireSessionOrRedirect();
  if (session.role !== "admin") {
    redirect("/projects");
  }

  return <IndustriesAdminView />;
}

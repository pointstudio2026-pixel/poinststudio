import { redirect } from "next/navigation";
import { requireSessionOrRedirect } from "@/shared/auth/session";
import { MockupTemplatesAdminView } from "@/features/admin/MockupTemplatesAdminView";

export default async function MockupTemplatesAdminPage() {
  const session = await requireSessionOrRedirect();
  if (session.role !== "admin") {
    redirect("/projects");
  }

  return <MockupTemplatesAdminView />;
}

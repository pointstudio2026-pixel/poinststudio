import { redirect } from "next/navigation";
import { requireSessionOrRedirect } from "@/shared/auth/session";
import { TrainingExamplesView } from "@/features/admin/TrainingExamplesView";

export default async function TrainingExamplesPage() {
  const session = await requireSessionOrRedirect();
  if (session.role !== "admin") {
    redirect("/projects");
  }

  return <TrainingExamplesView />;
}

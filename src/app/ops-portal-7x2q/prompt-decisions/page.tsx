import { redirect } from "next/navigation";
import { requireSessionOrRedirect } from "@/shared/auth/session";
import { PromptDecisionsView } from "@/features/admin/PromptDecisionsView";

export default async function PromptDecisionsPage() {
  const session = await requireSessionOrRedirect();
  if (session.role !== "admin") {
    redirect("/projects");
  }

  return <PromptDecisionsView />;
}

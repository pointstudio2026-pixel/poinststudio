import { redirect } from "next/navigation";
import { requireSessionOrRedirect } from "@/shared/auth/session";
import { PromptView } from "@/features/prompts/PromptView";

export default async function PromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSessionOrRedirect();
  if (session.role !== "admin") {
    redirect("/projects");
  }
  const { id } = await params;

  return <PromptView projectId={id} />;
}

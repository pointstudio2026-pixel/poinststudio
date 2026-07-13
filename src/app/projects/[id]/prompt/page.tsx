import { requireSessionOrRedirect } from "@/shared/auth/session";
import { PromptView } from "@/features/prompts/PromptView";

export default async function PromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSessionOrRedirect();
  const { id } = await params;

  return <PromptView projectId={id} />;
}

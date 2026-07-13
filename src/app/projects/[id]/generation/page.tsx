import { requireSessionOrRedirect } from "@/shared/auth/session";
import { GenerationView } from "@/features/generation/GenerationView";

export default async function GenerationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSessionOrRedirect();
  const { id } = await params;

  return <GenerationView projectId={id} />;
}

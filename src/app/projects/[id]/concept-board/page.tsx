import { requireSessionOrRedirect } from "@/shared/auth/session";
import { ConceptBoardView } from "@/features/conceptBoard/ConceptBoardView";

export default async function ConceptBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSessionOrRedirect();
  const { id } = await params;

  return <ConceptBoardView projectId={id} />;
}

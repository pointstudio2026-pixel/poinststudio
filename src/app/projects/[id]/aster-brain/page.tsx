import { requireSessionOrRedirect } from "@/shared/auth/session";
import { AsterBrainView } from "@/features/asterBrain/AsterBrainView";

export default async function AsterBrainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSessionOrRedirect();
  const { id } = await params;

  return <AsterBrainView projectId={id} />;
}

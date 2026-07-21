import { requireSessionOrRedirect } from "@/shared/auth/session";
import { DeliverableTypeView } from "@/features/projects/DeliverableTypeView";

export default async function DeliverableTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSessionOrRedirect();
  const { id } = await params;

  return <DeliverableTypeView projectId={id} />;
}

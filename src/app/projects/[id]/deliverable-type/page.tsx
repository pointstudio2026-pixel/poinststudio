import { requireSessionOrRedirect } from "@/shared/auth/session";
import { projectsContainer } from "@/modules/projects/container";
import { DeliverableTypeView } from "@/features/projects/DeliverableTypeView";

export default async function DeliverableTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSessionOrRedirect();
  const { id } = await params;
  const project = await projectsContainer.getProjectUseCase.execute({
    projectId: id,
    userId: session.sub,
  });

  return <DeliverableTypeView projectId={id} currentDeliverableType={project.deliverableType} />;
}

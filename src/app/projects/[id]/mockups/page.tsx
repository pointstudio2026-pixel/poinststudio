import { requireSessionOrRedirect } from "@/shared/auth/session";
import { projectsContainer } from "@/modules/projects/container";
import { MockupStudioView } from "@/features/mockups/MockupStudioView";

export default async function MockupsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSessionOrRedirect();
  const { id } = await params;
  const project = await projectsContainer.getProjectUseCase.execute({ projectId: id, userId: session.sub });

  return <MockupStudioView projectId={id} deliverableType={project.deliverableType} />;
}

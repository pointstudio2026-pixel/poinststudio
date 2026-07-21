import { requireSessionOrRedirect } from "@/shared/auth/session";
import { projectsContainer } from "@/modules/projects/container";
import { StylesView } from "@/features/styles/StylesView";

export default async function StylesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSessionOrRedirect();
  const { id } = await params;
  const project = await projectsContainer.getProjectUseCase.execute({ projectId: id, userId: session.sub });

  return <StylesView projectId={id} deliverableType={project.deliverableType} />;
}

import { requireSessionOrRedirect } from "@/shared/auth/session";
import { projectsContainer } from "@/modules/projects/container";
import { LogoChoiceView } from "@/features/workspace/LogoChoiceView";

export default async function LogoChoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSessionOrRedirect();
  const { id } = await params;
  const project = await projectsContainer.getProjectUseCase.execute({ projectId: id, userId: session.sub });

  return <LogoChoiceView projectId={id} deliverableType={project.deliverableType} />;
}

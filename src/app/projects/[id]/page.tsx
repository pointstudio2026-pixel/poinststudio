import { notFound } from "next/navigation";
import { requireSessionOrRedirect } from "@/shared/auth/session";
import { projectsContainer } from "@/modules/projects/container";
import { NotFoundError } from "@/shared/errors/AppError";
import type { Project } from "@/modules/projects/domain/Project";
import { WorkspaceView } from "@/features/workspace/WorkspaceView";
import type { ProjectDto } from "@/services/project-service";

async function loadProject(projectId: string, userId: string): Promise<Project> {
  try {
    return await projectsContainer.getProjectUseCase.execute({ projectId, userId });
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound();
    }
    throw err;
  }
}

function toDto(project: Project): ProjectDto {
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    deliverableType: project.deliverableType,
    currentStep: project.currentStep,
    isFavorite: project.isFavorite,
    archivedAt: project.archivedAt ? project.archivedAt.toISOString() : null,
    updatedAt: project.updatedAt.toISOString(),
  };
}

export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSessionOrRedirect();
  const { id } = await params;
  const project = await loadProject(id, session.sub);

  return <WorkspaceView project={toDto(project)} />;
}

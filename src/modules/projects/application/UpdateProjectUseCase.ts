import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { Project } from "@/modules/projects/domain/Project";
import type { UpdateProjectInput } from "@/modules/projects/schemas/project.schemas";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError } from "@/shared/errors/AppError";

export class UpdateProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(
    input: { projectId: string; userId: string } & UpdateProjectInput,
  ): Promise<Project> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const updated: Project = {
      ...project,
      name: input.name ?? project.name,
      isFavorite: input.isFavorite ?? project.isFavorite,
      archivedAt:
        input.archived === undefined ? project.archivedAt : input.archived ? new Date() : null,
      updatedAt: new Date(),
    };

    await this.projectRepository.save(updated);

    await recordActivity({
      userId: input.userId,
      projectId: project.id,
      eventType: "PROJECT_UPDATED",
      payload: {
        name: input.name,
        isFavorite: input.isFavorite,
        archived: input.archived,
      },
    });

    return updated;
  }
}

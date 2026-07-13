import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { Project } from "@/modules/projects/domain/Project";
import { NotFoundError } from "@/shared/errors/AppError";

export class GetProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: { projectId: string; userId: string }): Promise<Project> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      // Scoped-by-owner lookup: a project that exists but belongs to another
      // user is indistinguishable from one that doesn't exist at all.
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }
    return project;
  }
}

import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import { getActivityForProject, type ActivityLogEntry } from "@/shared/activity/activityLogger";
import { NotFoundError } from "@/shared/errors/AppError";

export class GetProjectActivityUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: { projectId: string; userId: string }): Promise<ActivityLogEntry[]> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }
    return getActivityForProject(input.projectId, 20);
  }
}

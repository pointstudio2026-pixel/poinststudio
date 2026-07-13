import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError } from "@/shared/errors/AppError";

export class DeleteProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: { projectId: string; userId: string }): Promise<void> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    // 22_DatabaseArchitecture.md Soft Delete Policy: 삭제된 프로젝트는
    // 휴지통으로 이동한다 — 즉시 완전 삭제가 아니다.
    await this.projectRepository.delete(input.projectId, input.userId);

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "PROJECT_DELETED",
    });
  }
}

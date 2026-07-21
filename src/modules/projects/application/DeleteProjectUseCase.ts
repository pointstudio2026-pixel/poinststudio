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
    // 팀원은 공유된 프로젝트를 수정할 수 있지만 삭제는 소유자 전용이다 --
    // findByIdForUser가 팀 접근까지 허용하므로 여기서 명시적으로 다시
    // 소유자인지 확인한다(존재 여부를 노출하지 않기 위해 403이 아닌 404).
    if (project.userId !== input.userId) {
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

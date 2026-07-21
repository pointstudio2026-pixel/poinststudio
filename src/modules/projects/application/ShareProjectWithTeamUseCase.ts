import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { Project } from "@/modules/projects/domain/Project";
import { NotFoundError } from "@/shared/errors/AppError";

/**
 * 프로젝트별 팀 공유 토글 -- 소유자 전용이다. UpdateProjectUseCase(이름
 * 변경/즐겨찾기/보관)에 얹지 않고 별도 유스케이스로 분리해 소유권 검사를
 * 명시적으로 강제한다(제너릭 patch에 묻으면 나중에 팀원도 호출 가능해질
 * 위험이 있음).
 */
export class ShareProjectWithTeamUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: { projectId: string; userId: string; sharedWithTeam: boolean }): Promise<Project> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project || project.userId !== input.userId) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const updated: Project = { ...project, sharedWithTeam: input.sharedWithTeam, updatedAt: new Date() };
    await this.projectRepository.save(updated);
    return updated;
  }
}

import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { StyleSelectionRepository } from "@/modules/styles/domain/StyleSelectionRepository";
import type { StyleSelection } from "@/modules/styles/domain/Style";
import { NotFoundError } from "@/shared/errors/AppError";

export class GetStyleSelectionHistoryUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly styleSelectionRepository: StyleSelectionRepository,
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<{
    current: StyleSelection | null;
    history: StyleSelection[];
  }> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const history = await this.styleSelectionRepository.listByProjectId(input.projectId);
    return { current: history[0] ?? null, history };
  }
}

import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { MockupRepository } from "@/modules/mockups/domain/MockupRepository";
import type { MockupCategory, MockupProject } from "@/modules/mockups/domain/Mockup";
import { NotFoundError } from "@/shared/errors/AppError";

export class GetMockupsUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly mockupRepository: MockupRepository,
  ) {}

  async execute(input: { projectId: string; userId: string; category?: MockupCategory }): Promise<MockupProject[]> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    return this.mockupRepository.listByProjectId(input.projectId, input.category);
  }
}

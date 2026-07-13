import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { MockupRepository } from "@/modules/mockups/domain/MockupRepository";
import { NotFoundError } from "@/shared/errors/AppError";

export class DeleteMockupUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly mockupRepository: MockupRepository,
  ) {}

  async execute(input: { mockupId: string; userId: string }): Promise<void> {
    const mockup = await this.mockupRepository.getById(input.mockupId);
    if (!mockup) {
      throw new NotFoundError("목업을 찾을 수 없습니다.", "MOCKUP_NOT_FOUND");
    }
    const project = await this.projectRepository.findByIdForUser(mockup.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("목업을 찾을 수 없습니다.", "MOCKUP_NOT_FOUND");
    }

    await this.mockupRepository.delete(input.mockupId);
  }
}

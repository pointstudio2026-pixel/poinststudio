import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { EditHistoryRepository } from "@/modules/edits/domain/EditHistoryRepository";
import type { EditHistoryEntryWithResult } from "@/modules/edits/domain/EditHistory";
import { NotFoundError } from "@/shared/errors/AppError";

export class GetEditHistoryUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly generationRepository: GenerationRepository,
    private readonly editHistoryRepository: EditHistoryRepository,
  ) {}

  async execute(input: { generationId: string; userId: string }): Promise<EditHistoryEntryWithResult[]> {
    const generation = await this.generationRepository.findById(input.generationId);
    if (!generation) {
      throw new NotFoundError("생성 이력을 찾을 수 없습니다.", "GENERATION_NOT_FOUND");
    }
    const project = await this.projectRepository.findByIdForUser(generation.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("생성 이력을 찾을 수 없습니다.", "GENERATION_NOT_FOUND");
    }

    const entries = await this.editHistoryRepository.listByGenerationId(input.generationId);
    const withResults: EditHistoryEntryWithResult[] = [];
    for (const entry of entries) {
      const resultVersion = await this.generationRepository.getVersionById(entry.resultVersionId);
      withResults.push({ ...entry, resultVersion });
    }
    return withResults;
  }
}

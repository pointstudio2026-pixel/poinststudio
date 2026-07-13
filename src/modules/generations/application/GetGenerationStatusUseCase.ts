import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { GenerationVersion } from "@/modules/generations/domain/Generation";
import { NotFoundError } from "@/shared/errors/AppError";

export class GetGenerationStatusUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly generationRepository: GenerationRepository,
  ) {}

  async execute(input: { generationVersionId: string; userId: string }): Promise<GenerationVersion> {
    const version = await this.generationRepository.getVersionById(input.generationVersionId);
    if (!version) {
      throw new NotFoundError("생성 요청을 찾을 수 없습니다.", "GENERATION_NOT_FOUND");
    }
    const generation = await this.generationRepository.findById(version.generationId);
    if (!generation) {
      throw new NotFoundError("생성 요청을 찾을 수 없습니다.", "GENERATION_NOT_FOUND");
    }
    const project = await this.projectRepository.findByIdForUser(generation.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("생성 요청을 찾을 수 없습니다.", "GENERATION_NOT_FOUND");
    }

    return version;
  }
}

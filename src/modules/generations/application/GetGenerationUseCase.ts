import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { Generation, GenerationVersion } from "@/modules/generations/domain/Generation";
import { NotFoundError } from "@/shared/errors/AppError";

export interface GetGenerationOutput {
  generation: Generation;
  versions: GenerationVersion[];
}

export class GetGenerationUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly generationRepository: GenerationRepository,
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<GetGenerationOutput> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const generation = await this.generationRepository.findByProjectId(input.projectId);
    if (!generation) {
      throw new NotFoundError("생성 이력이 아직 없습니다.", "GENERATION_NOT_FOUND");
    }

    const versions = await this.generationRepository.listVersions(generation.id);
    return { generation, versions };
  }
}

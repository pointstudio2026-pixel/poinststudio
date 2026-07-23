import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { GenerationFeedbackRepository } from "@/modules/generations/domain/GenerationFeedbackRepository";
import type { GenerationFeedback } from "@/modules/generations/domain/GenerationFeedback";
import { NotFoundError } from "@/shared/errors/AppError";

/**
 * 결과물에 대한 사용자 본인 평가 -- 선택형 태그(타이핑 불필요) + 자유
 * 텍스트(선택). 완전히 건너뛰기 가능(이 API를 호출하지 않으면 그냥 평가
 * 안 한 것). AI 호출 없음, 비용 0.
 */
export class SubmitGenerationFeedbackUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly generationRepository: GenerationRepository,
    private readonly feedbackRepository: GenerationFeedbackRepository,
  ) {}

  async execute(input: {
    generationVersionId: string;
    userId: string;
    likedTags: string[];
    dislikedTags: string[];
    freeText: string | null;
  }): Promise<GenerationFeedback> {
    const version = await this.generationRepository.getVersionById(input.generationVersionId);
    if (!version) {
      throw new NotFoundError("생성 결과를 찾을 수 없습니다.", "GENERATION_NOT_FOUND");
    }
    const generation = await this.generationRepository.findById(version.generationId);
    if (!generation) {
      throw new NotFoundError("생성 결과를 찾을 수 없습니다.", "GENERATION_NOT_FOUND");
    }
    const project = await this.projectRepository.findByIdForUser(generation.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    return this.feedbackRepository.upsert({
      generationVersionId: input.generationVersionId,
      likedTags: input.likedTags,
      dislikedTags: input.dislikedTags,
      freeText: input.freeText?.trim() || null,
    });
  }
}

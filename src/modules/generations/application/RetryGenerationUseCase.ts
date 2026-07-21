import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { PromptRepository } from "@/modules/prompts/domain/PromptRepository";
import type { CheckPlanUseCase } from "@/modules/subscriptions/application/CheckPlanUseCase";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { ImageGenerationQueuePort } from "@/modules/generations/domain/ImageGenerationQueuePort";
import type { GenerationVersion } from "@/modules/generations/domain/Generation";
import type { UserRole } from "@/shared/auth/jwt";
import { GENERATION_EVENT_TYPE } from "@/modules/subscriptions/domain/planLimits";
import { hasReachedResultCap, MAX_PROJECT_RESULTS } from "@/modules/generations/domain/resultCap";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, UsageLimitError } from "@/shared/errors/AppError";

export class RetryGenerationUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly promptRepository: PromptRepository,
    private readonly checkPlanUseCase: CheckPlanUseCase,
    private readonly generationRepository: GenerationRepository,
    private readonly queue: ImageGenerationQueuePort,
  ) {}

  async execute(input: {
    generationVersionId: string;
    userId: string;
    provider?: string;
    userRole?: UserRole;
  }): Promise<GenerationVersion> {
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
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const plan = await this.checkPlanUseCase.execute({
      userId: input.userId,
      eventType: GENERATION_EVENT_TYPE,
      userRole: input.userRole,
    });
    if (!plan.allowed) {
      throw new UsageLimitError(
        `이번 달 이미지 생성 한도(${plan.limit}회)를 모두 사용했습니다. (${plan.used}/${plan.limit})`,
      );
    }

    const versions = await this.generationRepository.listVersions(generation.id);
    if (hasReachedResultCap(versions)) {
      throw new UsageLimitError(`이 프로젝트에서 생성 가능한 결과는 최대 ${MAX_PROJECT_RESULTS}개입니다.`);
    }

    // 재시도 시점의 최신 Prompt를 다시 조회한다 -- 원래 생성 이후 브랜드
    // 정보가 바뀌었을 수 있다.
    const prompt = await this.promptRepository.findByProjectId(generation.projectId);
    if (!prompt) {
      throw new NotFoundError("Prompt를 찾을 수 없습니다.", "PROMPT_NOT_FOUND");
    }

    // 재시도 시 provider를 새로 지정하지 않으면 원래 시도했던 provider를
    // 그대로 이어간다 (사용자가 굳이 다시 고를 필요 없게).
    const updated = await this.generationRepository.addVersion(generation.id, {
      promptVersionId: prompt.currentVersion.id,
      providerPreference: input.provider ?? version.providerPreference,
    });

    await this.queue.enqueue({
      generationVersionId: updated.currentVersion.id,
      requestedByUserId: input.userId,
    });

    await recordActivity({
      userId: input.userId,
      projectId: generation.projectId,
      eventType: "GENERATION_RETRIED",
      payload: { generationVersionId: updated.currentVersion.id, retriedFrom: input.generationVersionId },
    });

    return updated.currentVersion;
  }
}

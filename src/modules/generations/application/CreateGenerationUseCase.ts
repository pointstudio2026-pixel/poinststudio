import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { PromptRepository } from "@/modules/prompts/domain/PromptRepository";
import type { BuildPromptUseCase } from "@/modules/prompts/application/BuildPromptUseCase";
import type { CheckPlanUseCase } from "@/modules/subscriptions/application/CheckPlanUseCase";
import type { EnsureEmailVerifiedUseCase } from "@/modules/auth/application/EnsureEmailVerifiedUseCase";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { ImageGenerationQueuePort } from "@/modules/generations/domain/ImageGenerationQueuePort";
import type { GenerationVersion } from "@/modules/generations/domain/Generation";
import type { UserRole } from "@/shared/auth/jwt";
import { GENERATION_EVENT_TYPE } from "@/modules/subscriptions/domain/planLimits";
import { hasReachedResultCap, MAX_PROJECT_RESULTS } from "@/modules/generations/domain/resultCap";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, UsageLimitError } from "@/shared/errors/AppError";

export class CreateGenerationUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly promptRepository: PromptRepository,
    private readonly buildPromptUseCase: BuildPromptUseCase,
    private readonly checkPlanUseCase: CheckPlanUseCase,
    private readonly ensureEmailVerifiedUseCase: EnsureEmailVerifiedUseCase,
    private readonly generationRepository: GenerationRepository,
    private readonly queue: ImageGenerationQueuePort,
  ) {}

  async execute(input: {
    projectId: string;
    userId: string;
    provider?: string;
    userRole?: UserRole;
  }): Promise<GenerationVersion> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    // 실제 비용이 발생하는 지점이라 여기서만 이메일 인증을 요구한다(로그인
    // 자체는 막지 않음 -- EnsureEmailVerifiedUseCase 참고).
    await this.ensureEmailVerifiedUseCase.execute({ userId: input.userId, userRole: input.userRole });

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

    // Prompt Engine이 준비되어 있지 않으면(=Brand Brief/Strategy/Style 중
    // 누락) 여기서 자동으로 만들려다 PROMPT-001 ConflictError가 그대로
    // 전파된다 -- Generation은 별도의 게이팅 코드를 중복하지 않는다.
    let prompt = await this.promptRepository.findByProjectId(input.projectId);
    if (!prompt) {
      prompt = await this.buildPromptUseCase.execute({ projectId: input.projectId, userId: input.userId });
    }

    const existing = await this.generationRepository.findByProjectId(input.projectId);
    if (existing) {
      const versions = await this.generationRepository.listVersions(existing.id);
      if (hasReachedResultCap(versions)) {
        throw new UsageLimitError(`이 프로젝트에서 생성 가능한 결과는 최대 ${MAX_PROJECT_RESULTS}개입니다.`);
      }
    }

    const generation = existing
      ? await this.generationRepository.addVersion(existing.id, {
          promptVersionId: prompt.currentVersion.id,
          providerPreference: input.provider,
        })
      : await this.generationRepository.createWithFirstVersion(input.projectId, {
          promptVersionId: prompt.currentVersion.id,
          providerPreference: input.provider,
        });

    await this.queue.enqueue({
      generationVersionId: generation.currentVersion.id,
      requestedByUserId: input.userId,
    });

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "GENERATION_REQUESTED",
      payload: { generationVersionId: generation.currentVersion.id },
    });

    return generation.currentVersion;
  }
}

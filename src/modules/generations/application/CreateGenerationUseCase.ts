import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { PromptRepository } from "@/modules/prompts/domain/PromptRepository";
import type { BuildPromptUseCase } from "@/modules/prompts/application/BuildPromptUseCase";
import type { CheckPlanUseCase } from "@/modules/subscriptions/application/CheckPlanUseCase";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { ImageGenerationQueuePort } from "@/modules/generations/domain/ImageGenerationQueuePort";
import type { GenerationVersion } from "@/modules/generations/domain/Generation";
import { GENERATION_EVENT_TYPE } from "@/modules/subscriptions/domain/planLimits";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, UsageLimitError } from "@/shared/errors/AppError";

export class CreateGenerationUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly promptRepository: PromptRepository,
    private readonly buildPromptUseCase: BuildPromptUseCase,
    private readonly checkPlanUseCase: CheckPlanUseCase,
    private readonly generationRepository: GenerationRepository,
    private readonly queue: ImageGenerationQueuePort,
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<GenerationVersion> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const plan = await this.checkPlanUseCase.execute({
      userId: input.userId,
      eventType: GENERATION_EVENT_TYPE,
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
    const generation = existing
      ? await this.generationRepository.addVersion(existing.id, { promptVersionId: prompt.currentVersion.id })
      : await this.generationRepository.createWithFirstVersion(input.projectId, {
          promptVersionId: prompt.currentVersion.id,
        });

    await this.queue.enqueue({ generationVersionId: generation.currentVersion.id });

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "GENERATION_REQUESTED",
      payload: { generationVersionId: generation.currentVersion.id },
    });

    return generation.currentVersion;
  }
}

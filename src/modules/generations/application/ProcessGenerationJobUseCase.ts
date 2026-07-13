import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { PromptRepository } from "@/modules/prompts/domain/PromptRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import type { ImageGenerationProvider } from "@/shared/ai/ImageGenerationProvider";
import { GENERATION_EVENT_TYPE } from "@/modules/subscriptions/domain/planLimits";
import { WORKSPACE_STEPS } from "@/modules/projects/domain/Project";
import { recordActivity } from "@/shared/activity/activityLogger";
import { logger } from "@/shared/logging/logger";

const IMAGES_PER_GENERATION = 3;

/**
 * The actual generation work, run inside the BullMQ Worker (never inside a
 * Route Handler -- 30_CLAUDE.md / Task-013's explicit mandate). Kept as a
 * plain Use Case so it's testable against fakes without a real queue/Redis.
 */
export class ProcessGenerationJobUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly promptRepository: PromptRepository,
    private readonly generationRepository: GenerationRepository,
    private readonly recordUsageUseCase: RecordUsageUseCase,
    private readonly imageGenerationProvider: ImageGenerationProvider,
  ) {}

  async execute(input: { generationVersionId: string; isFinalAttempt: boolean }): Promise<void> {
    const version = await this.generationRepository.getVersionById(input.generationVersionId);
    if (!version) return;
    const generation = await this.generationRepository.findById(version.generationId);
    if (!generation) return;

    await this.generationRepository.updateVersionResult(version.id, { status: "processing" });

    const promptVersion = await this.promptRepository.getVersionById(version.promptVersionId);
    if (!promptVersion) {
      await this.generationRepository.updateVersionResult(version.id, {
        status: "failed",
        errorMessage: "연결된 Prompt 버전을 찾을 수 없습니다.",
      });
      return;
    }

    try {
      const result = await this.imageGenerationProvider.generate({
        systemPrompt: promptVersion.systemPrompt,
        userPrompt: promptVersion.userPrompt,
        count: IMAGES_PER_GENERATION,
      });

      await this.generationRepository.updateVersionResult(version.id, {
        status: "completed",
        provider: result.provider,
        images: result.images,
        costAmount: result.costAmount,
        completedAt: new Date(),
      });

      const project = await this.projectRepository.findById(generation.projectId);
      if (project) {
        await this.recordUsageUseCase.execute({
          userId: project.userId,
          projectId: generation.projectId,
          eventType: GENERATION_EVENT_TYPE,
          quantity: 1,
          costAmount: result.costAmount,
        });

        const stepIndex = WORKSPACE_STEPS.findIndex((s) => s.key === "generation");
        const nextStep = WORKSPACE_STEPS[stepIndex + 1];
        if (nextStep && project.currentStep === "generation") {
          await this.projectRepository.save({ ...project, currentStep: nextStep.key, updatedAt: new Date() });
        }

        await recordActivity({
          userId: project.userId,
          projectId: generation.projectId,
          eventType: "GENERATION_COMPLETED",
          payload: { generationVersionId: version.id, imageCount: result.images.length },
        });
      }
    } catch (err) {
      logger.error("Image generation job failed", {
        generationVersionId: version.id,
        isFinalAttempt: input.isFinalAttempt,
        details: err instanceof Error ? err.message : String(err),
      });

      if (!input.isFinalAttempt) {
        // Let BullMQ's retry/backoff handle it -- don't mark "failed" yet.
        throw err;
      }

      await this.generationRepository.updateVersionResult(version.id, {
        status: "failed",
        errorMessage: err instanceof Error ? err.message : "이미지 생성에 실패했습니다.",
      });

      const project = await this.projectRepository.findById(generation.projectId);
      if (project) {
        await recordActivity({
          userId: project.userId,
          projectId: generation.projectId,
          eventType: "GENERATION_FAILED",
          payload: { generationVersionId: version.id },
        });
      }
    }
  }
}

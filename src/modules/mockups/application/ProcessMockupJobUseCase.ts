import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { MockupRepository } from "@/modules/mockups/domain/MockupRepository";
import type { MockupTemplateRepository } from "@/modules/mockups/domain/MockupTemplateRepository";
import type { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import type { MockupRenderProvider } from "@/shared/ai/MockupRenderProvider";
import { GENERATION_EVENT_TYPE } from "@/modules/subscriptions/domain/planLimits";
import { recordActivity } from "@/shared/activity/activityLogger";
import { logger } from "@/shared/logging/logger";

/** The actual render work, run inside the BullMQ Worker -- mirrors ProcessGenerationJobUseCase/ProcessEditJobUseCase. */
export class ProcessMockupJobUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly generationRepository: GenerationRepository,
    private readonly mockupRepository: MockupRepository,
    private readonly templateRepository: MockupTemplateRepository,
    private readonly recordUsageUseCase: RecordUsageUseCase,
    private readonly mockupRenderProvider: MockupRenderProvider,
  ) {}

  async execute(input: { mockupId: string; isFinalAttempt: boolean }): Promise<void> {
    const mockup = await this.mockupRepository.getById(input.mockupId);
    if (!mockup) return;

    await this.mockupRepository.updateResult(mockup.id, { status: "processing" });

    const sourceVersion = await this.generationRepository.getVersionById(mockup.generationVersionId);
    const sourceImage = sourceVersion?.images[mockup.sourceImageIndex];
    const template = await this.templateRepository.findById(mockup.templateId);

    if (!sourceVersion || !sourceImage || !template) {
      await this.mockupRepository.updateResult(mockup.id, {
        status: "failed",
        errorMessage: "원본 이미지 또는 템플릿을 찾을 수 없습니다.",
      });
      return;
    }

    try {
      const result = await this.mockupRenderProvider.render({
        logoImageUrl: sourceImage.url,
        backgroundUrl: template.backgroundUrl,
        placementArea: template.placementArea,
        templateName: template.name,
      });

      await this.mockupRepository.updateResult(mockup.id, {
        status: "completed",
        resultImageUrl: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl,
        provider: result.provider,
        costAmount: result.costAmount,
        completedAt: new Date(),
      });

      const project = await this.projectRepository.findById(mockup.projectId);
      if (project) {
        await this.recordUsageUseCase.execute({
          userId: project.userId,
          projectId: mockup.projectId,
          eventType: GENERATION_EVENT_TYPE,
          quantity: 1,
          costAmount: result.costAmount,
        });
        await recordActivity({
          userId: project.userId,
          projectId: mockup.projectId,
          eventType: "MOCKUP_COMPLETED",
          payload: { mockupId: mockup.id, templateId: mockup.templateId },
        });
      }
    } catch (err) {
      logger.error("Mockup render job failed", {
        mockupId: mockup.id,
        isFinalAttempt: input.isFinalAttempt,
        details: err instanceof Error ? err.message : String(err),
      });

      if (!input.isFinalAttempt) {
        throw err;
      }

      const errorMessage = err instanceof Error ? err.message : "목업 렌더링에 실패했습니다.";
      await this.mockupRepository.updateResult(mockup.id, { status: "failed", errorMessage });

      const project = await this.projectRepository.findById(mockup.projectId);
      if (project) {
        await recordActivity({
          userId: project.userId,
          projectId: mockup.projectId,
          eventType: "MOCKUP_FAILED",
          payload: { mockupId: mockup.id },
        });
      }
    }
  }
}

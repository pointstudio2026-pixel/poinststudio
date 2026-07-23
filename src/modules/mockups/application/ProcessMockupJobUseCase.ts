import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { MockupRepository } from "@/modules/mockups/domain/MockupRepository";
import type { MockupTemplateRepository } from "@/modules/mockups/domain/MockupTemplateRepository";
import type { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import type { MockupRenderProvider } from "@/shared/ai/MockupRenderProvider";
import type { TrainingExampleRepository } from "@/modules/trainingExamples/domain/TrainingExampleRepository";
import { TRAINING_EXAMPLE_CATEGORY_MOCKUP } from "@/modules/trainingExamples/domain/TrainingExample";
import { rankTrainingExamples } from "@/modules/trainingExamples/domain/trainingExampleRules";
import { GENERATION_EVENT_TYPE } from "@/modules/subscriptions/domain/planLimits";
import { isBrandingDeliverableType } from "@/modules/projects/domain/deliverableTypes";
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
    private readonly trainingExampleRepository: TrainingExampleRepository,
  ) {}

  async execute(input: { mockupId: string; isFinalAttempt: boolean; requestedByUserId: string }): Promise<void> {
    const mockup = await this.mockupRepository.getById(input.mockupId);
    if (!mockup) return;

    await this.mockupRepository.updateResult(mockup.id, { status: "processing" });

    const sourceVersion = await this.generationRepository.getVersionById(mockup.generationVersionId);
    const sourceImage = sourceVersion?.images[mockup.sourceImageIndex];
    const template = await this.templateRepository.findById(mockup.templateId);
    const project = await this.projectRepository.findById(mockup.projectId);

    if (!sourceVersion || !sourceImage || !template || !project) {
      await this.mockupRepository.updateResult(mockup.id, {
        status: "failed",
        errorMessage: "원본 이미지 또는 템플릿을 찾을 수 없습니다.",
      });
      return;
    }

    // 포스터/브로슈어처럼 "완성된 결과물" 자체를 만드는 deliverableType은 로고
    // 마크가 아니라 생성물 전체를 큰 영역에 그대로 합성한다(fullDesign 모드) --
    // 브랜딩 & 로고(또는 레거시 null) 프로젝트는 로고 하나만 만들어지므로 항상
    // 기존 로고 마크 모드를 쓴다. fullDesignPlacementArea가 없는 템플릿(아직
    // 매핑 안 된 카테고리)은 로고 모드 영역으로 폴백한다.
    const isBranding = isBrandingDeliverableType(project.deliverableType);
    const compositingMode = isBranding ? "logo" : "fullDesign";
    const placementArea = isBranding ? template.placementArea : (template.fullDesignPlacementArea ?? template.placementArea);

    // 관리자가 등록한 "목업" 카테고리 학습 자료 중 이 작업물 유형과 같은
    // 것을 연출 참고 문구로 반영한다 -- AI 호출 없는 결정론적 키워드 매칭.
    // "이미지생성" 카테고리 자료는 여기서 절대 조회하지 않는다(파이프라인
    // 분리, 사용자 지시사항).
    let referenceExampleText: string | undefined;
    if (project.deliverableType) {
      const candidates = await this.trainingExampleRepository.listByDeliverableType(
        project.deliverableType,
        TRAINING_EXAMPLE_CATEGORY_MOCKUP,
      );
      const [top] = rankTrainingExamples(candidates, {
        keywordText: template.name,
        deliverableType: project.deliverableType,
      }).filter((r) => r.score > 0);
      referenceExampleText = top?.example.prompt;
    }

    try {
      const result = await this.mockupRenderProvider.render({
        logoImageUrl: sourceImage.url,
        backgroundUrl: template.backgroundUrl,
        placementArea,
        templateName: template.name,
        compositingMode,
        referenceExampleText,
      });

      await this.mockupRepository.updateResult(mockup.id, {
        status: "completed",
        resultImageUrl: result.imageUrl,
        thumbnailUrl: result.thumbnailUrl,
        provider: result.provider,
        costAmount: result.costAmount,
        completedAt: new Date(),
      });

      await this.recordUsageUseCase.execute({
        userId: input.requestedByUserId,
        projectId: mockup.projectId,
        eventType: GENERATION_EVENT_TYPE,
        quantity: 1,
        costAmount: result.costAmount,
        metadata: { source: "mockup", provider: result.provider },
      });
      await recordActivity({
        userId: input.requestedByUserId,
        projectId: mockup.projectId,
        eventType: "MOCKUP_COMPLETED",
        payload: { mockupId: mockup.id, templateId: mockup.templateId },
      });
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

      await recordActivity({
        userId: input.requestedByUserId,
        projectId: mockup.projectId,
        eventType: "MOCKUP_FAILED",
        payload: { mockupId: mockup.id },
      });
    }
  }
}

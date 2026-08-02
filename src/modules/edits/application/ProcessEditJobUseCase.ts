import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { PromptRepository } from "@/modules/prompts/domain/PromptRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { EditHistoryRepository } from "@/modules/edits/domain/EditHistoryRepository";
import type { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import type { ImageGenerationProvider } from "@/shared/ai/ImageGenerationProvider";
import type { ProjectLogoAssetRepository } from "@/modules/projectLogos/domain/ProjectLogoAssetRepository";
import type { GenerateFromLogoAssetUseCase } from "@/modules/generations/application/GenerateFromLogoAssetUseCase";
import { EDIT_PRESETS } from "@/modules/edits/domain/EditPresets";
import { GENERATION_EVENT_TYPE } from "@/modules/subscriptions/domain/planLimits";
import { recordActivity } from "@/shared/activity/activityLogger";
import { logger } from "@/shared/logging/logger";

/**
 * The actual edit work, run inside the BullMQ Worker -- mirrors
 * ProcessGenerationJobUseCase (Task-013). Kept as a plain Use Case so it's
 * testable against fakes without a real queue/Redis.
 */
export class ProcessEditJobUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly promptRepository: PromptRepository,
    private readonly generationRepository: GenerationRepository,
    private readonly editHistoryRepository: EditHistoryRepository,
    private readonly recordUsageUseCase: RecordUsageUseCase,
    private readonly imageGenerationProvider: ImageGenerationProvider,
    private readonly projectLogoAssetRepository: ProjectLogoAssetRepository,
    private readonly generateFromLogoAssetUseCase: GenerateFromLogoAssetUseCase,
  ) {}

  async execute(input: {
    editHistoryId: string;
    isFinalAttempt: boolean;
    requestedByUserId: string;
  }): Promise<void> {
    const editEntry = await this.editHistoryRepository.getById(input.editHistoryId);
    if (!editEntry) return;
    const generation = await this.generationRepository.findById(editEntry.generationId);
    if (!generation) return;

    await this.editHistoryRepository.update(editEntry.id, { status: "processing" });
    await this.generationRepository.updateVersionResult(editEntry.resultVersionId, { status: "processing" });

    const sourceVersion = await this.generationRepository.getVersionById(editEntry.sourceVersionId);
    const sourceImage = sourceVersion?.images[editEntry.sourceImageIndex];
    const promptVersion = sourceVersion
      ? await this.promptRepository.getVersionById(sourceVersion.promptVersionId)
      : null;

    if (!sourceVersion || !sourceImage || !promptVersion) {
      await this.editHistoryRepository.update(editEntry.id, {
        status: "failed",
        errorMessage: "원본 이미지 또는 Prompt를 찾을 수 없습니다.",
      });
      await this.generationRepository.updateVersionResult(editEntry.resultVersionId, {
        status: "failed",
        errorMessage: "원본 이미지 또는 Prompt를 찾을 수 없습니다.",
      });
      return;
    }

    try {
      // presetKey/customInstruction 중 생성 시점에 정확히 하나만 채워지므로
      // (CreateEditUseCase의 XOR 검증), 프리셋이 없으면 항상 자유 텍스트가
      // 있다고 가정할 수 있다.
      const instructionText = editEntry.customInstruction ?? EDIT_PRESETS[editEntry.presetKey!].instruction;
      const editInstruction = `${promptVersion.userPrompt}\n\n추가 수정 지시: ${instructionText}`;

      // 2026-08-02 버그 수정: "다시 생성"/프리셋 버튼/자유 텍스트 수정 요청이
      // 전부 이 경로를 타는데, 실제 로고가 첨부·확정된 프로젝트에서도 항상
      // 직전 결과 이미지(이미 AI가 상상해 그린 로고가 픽셀로 박힌 상태)를
      // 텍스트 지시만 덧붙여 다시 편집했다 -- 최초 생성 때만 실제 로고를
      // 반영하고 그 이후 모든 수정에서는 반영이 끊기는 문제였다.
      // ProcessGenerationJobUseCase와 동일한 게이트(confirmed된 자산만)로
      // 분기하고, 소스 이미지 대신 실제 로고 파일을 다시 첨부해 매번
      // 로고만은 원본 그대로 유지한다.
      const project = await this.projectRepository.findById(generation.projectId);
      const logoAsset = project ? await this.projectLogoAssetRepository.findByProjectId(project.id) : null;
      const result = logoAsset?.confirmed
        ? await this.generateFromLogoAssetUseCase.execute({
            logoAsset,
            systemPrompt: promptVersion.systemPrompt,
            userPrompt: editInstruction,
            sizePreset: promptVersion.payload.sizePreset,
          })
        : await this.imageGenerationProvider.edit({
            sourceImageUrl: sourceImage.url,
            systemPrompt: promptVersion.systemPrompt,
            editInstruction,
          });

      await this.generationRepository.updateVersionResult(editEntry.resultVersionId, {
        status: "completed",
        provider: result.provider,
        images: result.images,
        costAmount: result.costAmount,
        completedAt: new Date(),
      });
      await this.editHistoryRepository.update(editEntry.id, { status: "completed", completedAt: new Date() });

      if (project) {
        await this.recordUsageUseCase.execute({
          userId: input.requestedByUserId,
          projectId: generation.projectId,
          eventType: GENERATION_EVENT_TYPE,
          quantity: 1,
          costAmount: result.costAmount,
          metadata: { source: "edit", provider: result.provider },
        });
        await recordActivity({
          userId: input.requestedByUserId,
          projectId: generation.projectId,
          eventType: "EDIT_COMPLETED",
          payload: { editId: editEntry.id, presetKey: editEntry.presetKey, customInstruction: editEntry.customInstruction },
        });
      }
    } catch (err) {
      logger.error("Image edit job failed", {
        editHistoryId: editEntry.id,
        isFinalAttempt: input.isFinalAttempt,
        details: err instanceof Error ? err.message : String(err),
      });

      if (!input.isFinalAttempt) {
        throw err;
      }

      const errorMessage = err instanceof Error ? err.message : "이미지 수정에 실패했습니다.";
      await this.editHistoryRepository.update(editEntry.id, { status: "failed", errorMessage });
      await this.generationRepository.updateVersionResult(editEntry.resultVersionId, {
        status: "failed",
        errorMessage,
      });

      const project = await this.projectRepository.findById(generation.projectId);
      if (project) {
        await recordActivity({
          userId: input.requestedByUserId,
          projectId: generation.projectId,
          eventType: "EDIT_FAILED",
          payload: { editId: editEntry.id },
        });
      }
    }
  }
}

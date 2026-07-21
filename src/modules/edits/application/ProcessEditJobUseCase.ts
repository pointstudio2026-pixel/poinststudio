import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { PromptRepository } from "@/modules/prompts/domain/PromptRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { EditHistoryRepository } from "@/modules/edits/domain/EditHistoryRepository";
import type { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import type { ImageGenerationProvider } from "@/shared/ai/ImageGenerationProvider";
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

      const result = await this.imageGenerationProvider.edit({
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

      const project = await this.projectRepository.findById(generation.projectId);
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

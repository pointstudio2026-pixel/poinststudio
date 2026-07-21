import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { CheckPlanUseCase } from "@/modules/subscriptions/application/CheckPlanUseCase";
import type { EditHistoryRepository } from "@/modules/edits/domain/EditHistoryRepository";
import type { ImageEditQueuePort } from "@/modules/edits/domain/ImageEditQueuePort";
import type { EditHistoryEntry } from "@/modules/edits/domain/EditHistory";
import { isEditPresetKey, type EditPresetKey } from "@/modules/edits/domain/EditPresets";
import type { UserRole } from "@/shared/auth/jwt";
import { GENERATION_EVENT_TYPE } from "@/modules/subscriptions/domain/planLimits";
import { hasReachedResultCap, MAX_PROJECT_RESULTS } from "@/modules/generations/domain/resultCap";
import { recordActivity } from "@/shared/activity/activityLogger";
import { ConflictError, NotFoundError, UsageLimitError, ValidationError } from "@/shared/errors/AppError";

export class CreateEditUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly generationRepository: GenerationRepository,
    private readonly checkPlanUseCase: CheckPlanUseCase,
    private readonly editHistoryRepository: EditHistoryRepository,
    private readonly queue: ImageEditQueuePort,
  ) {}

  async execute(input: {
    projectId: string;
    userId: string;
    sourceVersionId: string;
    sourceImageIndex: number;
    /** presetKey/customInstruction 중 정확히 하나만 채워져야 한다(라우트의 Zod XOR 검증과 동일한 규칙을 여기서도 방어적으로 재확인). */
    presetKey?: string;
    customInstruction?: string;
    userRole?: UserRole;
  }): Promise<EditHistoryEntry> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const trimmedCustomInstruction = input.customInstruction?.trim() || undefined;
    if (Boolean(input.presetKey) === Boolean(trimmedCustomInstruction)) {
      throw new ValidationError("수정 옵션을 하나 선택하거나 직접 입력해야 합니다.");
    }

    let presetKey: EditPresetKey | null = null;
    if (input.presetKey) {
      if (!isEditPresetKey(input.presetKey)) {
        throw new ValidationError("존재하지 않는 수정 옵션입니다.", { presetKey: input.presetKey });
      }
      presetKey = input.presetKey;
    }

    const generation = await this.generationRepository.findByProjectId(input.projectId);
    if (!generation) {
      throw new NotFoundError("생성 이력을 찾을 수 없습니다.", "GENERATION_NOT_FOUND");
    }

    const sourceVersion = await this.generationRepository.getVersionById(input.sourceVersionId);
    if (!sourceVersion || sourceVersion.generationId !== generation.id) {
      throw new NotFoundError("수정할 이미지를 찾을 수 없습니다.", "GENERATION_NOT_FOUND");
    }
    if (sourceVersion.status !== "completed") {
      throw new ConflictError("완료된 생성 결과만 수정할 수 있습니다.", "EDIT-001");
    }
    if (input.sourceImageIndex < 0 || input.sourceImageIndex >= sourceVersion.images.length) {
      throw new ValidationError("존재하지 않는 이미지입니다.", { sourceImageIndex: input.sourceImageIndex });
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

    // 원본은 그대로 두고, 결과를 담을 새 GenerationVersion을 pending으로
    // 먼저 만든 뒤 EditHistory가 그 버전을 가리킨다("원본 이미지 보존").
    const updatedGeneration = await this.generationRepository.addVersion(generation.id, {
      promptVersionId: sourceVersion.promptVersionId,
    });

    const editEntry = await this.editHistoryRepository.create({
      generationId: generation.id,
      sourceVersionId: sourceVersion.id,
      sourceImageIndex: input.sourceImageIndex,
      presetKey,
      customInstruction: trimmedCustomInstruction ?? null,
      resultVersionId: updatedGeneration.currentVersion.id,
    });

    await this.queue.enqueue({ editHistoryId: editEntry.id, requestedByUserId: input.userId });

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "EDIT_REQUESTED",
      payload: { editId: editEntry.id, presetKey, customInstruction: trimmedCustomInstruction ?? null },
    });

    return editEntry;
  }
}

import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { CheckPlanUseCase } from "@/modules/subscriptions/application/CheckPlanUseCase";
import type { EditHistoryRepository } from "@/modules/edits/domain/EditHistoryRepository";
import type { ImageEditQueuePort } from "@/modules/edits/domain/ImageEditQueuePort";
import type { EditHistoryEntry } from "@/modules/edits/domain/EditHistory";
import { GENERATION_EVENT_TYPE } from "@/modules/subscriptions/domain/planLimits";
import { recordActivity } from "@/shared/activity/activityLogger";
import { NotFoundError, UsageLimitError } from "@/shared/errors/AppError";

export class RetryEditUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly generationRepository: GenerationRepository,
    private readonly checkPlanUseCase: CheckPlanUseCase,
    private readonly editHistoryRepository: EditHistoryRepository,
    private readonly queue: ImageEditQueuePort,
  ) {}

  async execute(input: { editHistoryId: string; userId: string }): Promise<EditHistoryEntry> {
    const original = await this.editHistoryRepository.getById(input.editHistoryId);
    if (!original) {
      throw new NotFoundError("수정 요청을 찾을 수 없습니다.", "EDIT_NOT_FOUND");
    }
    const generation = await this.generationRepository.findById(original.generationId);
    if (!generation) {
      throw new NotFoundError("수정 요청을 찾을 수 없습니다.", "EDIT_NOT_FOUND");
    }
    const project = await this.projectRepository.findByIdForUser(generation.projectId, input.userId);
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

    const sourceVersion = await this.generationRepository.getVersionById(original.sourceVersionId);
    if (!sourceVersion) {
      throw new NotFoundError("원본 이미지를 찾을 수 없습니다.", "GENERATION_NOT_FOUND");
    }

    const updatedGeneration = await this.generationRepository.addVersion(generation.id, {
      promptVersionId: sourceVersion.promptVersionId,
    });

    const editEntry = await this.editHistoryRepository.create({
      generationId: generation.id,
      sourceVersionId: original.sourceVersionId,
      sourceImageIndex: original.sourceImageIndex,
      presetKey: original.presetKey,
      resultVersionId: updatedGeneration.currentVersion.id,
    });

    await this.queue.enqueue({ editHistoryId: editEntry.id });

    await recordActivity({
      userId: input.userId,
      projectId: generation.projectId,
      eventType: "EDIT_RETRIED",
      payload: { editId: editEntry.id, retriedFrom: input.editHistoryId },
    });

    return editEntry;
  }
}

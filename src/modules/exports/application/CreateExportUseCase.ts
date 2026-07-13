import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { ConceptBoardRepository } from "@/modules/conceptBoards/domain/ConceptBoardRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { MockupRepository } from "@/modules/mockups/domain/MockupRepository";
import type { GetSubscriptionUseCase } from "@/modules/subscriptions/application/GetSubscriptionUseCase";
import type { ExportRepository } from "@/modules/exports/domain/ExportRepository";
import type { ExportQueuePort } from "@/modules/exports/domain/ExportQueuePort";
import type { ExportFormat, ExportJob, ExportSource } from "@/modules/exports/domain/Export";
import type { ConceptBoardSectionKey } from "@/modules/conceptBoards/domain/ConceptBoard";
import { VALID_FORMATS_BY_SOURCE } from "@/modules/exports/domain/Export";
import { CONCEPT_BOARD_SECTIONS } from "@/modules/conceptBoards/domain/ConceptBoard";
import { recordActivity } from "@/shared/activity/activityLogger";
import { ConflictError, NotFoundError, ValidationError } from "@/shared/errors/AppError";

export class CreateExportUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly conceptBoardRepository: ConceptBoardRepository,
    private readonly generationRepository: GenerationRepository,
    private readonly mockupRepository: MockupRepository,
    private readonly getSubscriptionUseCase: GetSubscriptionUseCase,
    private readonly exportRepository: ExportRepository,
    private readonly queue: ExportQueuePort,
  ) {}

  async execute(input: {
    projectId: string;
    userId: string;
    source: ExportSource;
    format: ExportFormat;
    sourceRefId?: string;
    sections?: ConceptBoardSectionKey[];
    includeBrandInfo?: boolean;
  }): Promise<ExportJob> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    if (!VALID_FORMATS_BY_SOURCE[input.source].includes(input.format)) {
      throw new ValidationError(
        `${input.source}는 ${VALID_FORMATS_BY_SOURCE[input.source].join("/")} 형식만 지원합니다.`,
        { source: input.source, format: input.format },
      );
    }

    let sourceRefId: string | null = null;

    if (input.source === "concept_board") {
      const board = await this.conceptBoardRepository.findByProjectId(input.projectId);
      if (!board) {
        throw new ConflictError("Concept Board가 아직 생성되지 않았습니다.", "EXPORT-001");
      }
    } else if (input.source === "generation") {
      if (!input.sourceRefId) {
        throw new ValidationError("generationVersionId가 필요합니다.");
      }
      const version = await this.generationRepository.getVersionById(input.sourceRefId);
      if (!version) {
        throw new NotFoundError("생성 결과를 찾을 수 없습니다.", "GENERATION_NOT_FOUND");
      }
      if (version.status !== "completed") {
        throw new ConflictError("완료된 생성 결과만 내보낼 수 있습니다.", "EXPORT-001");
      }
      sourceRefId = input.sourceRefId;
    } else {
      if (!input.sourceRefId) {
        throw new ValidationError("mockupId가 필요합니다.");
      }
      const mockup = await this.mockupRepository.getById(input.sourceRefId);
      if (!mockup || mockup.projectId !== input.projectId) {
        throw new NotFoundError("목업을 찾을 수 없습니다.", "MOCKUP_NOT_FOUND");
      }
      if (mockup.status !== "completed") {
        throw new ConflictError("완료된 목업만 내보낼 수 있습니다.", "EXPORT-001");
      }
      sourceRefId = input.sourceRefId;
    }

    // 워터마크 정책(플랜별): Free 플랜은 워터마크가 포함된 결과물을 받는다
    // (구독 제한 확인) -- Export 자체를 막지는 않는다.
    const subscription = await this.getSubscriptionUseCase.execute({ userId: input.userId });
    const watermarked = subscription.planCode === "free";

    const job = await this.exportRepository.create({
      projectId: input.projectId,
      source: input.source,
      format: input.format,
      sourceRefId,
      sections: input.sections && input.sections.length > 0 ? input.sections : [...CONCEPT_BOARD_SECTIONS],
      includeBrandInfo: input.includeBrandInfo ?? true,
      watermarked,
    });

    await this.queue.enqueue({ exportId: job.id });

    await recordActivity({
      userId: input.userId,
      projectId: input.projectId,
      eventType: "EXPORT_REQUESTED",
      payload: { exportId: job.id, source: input.source, format: input.format },
    });

    return job;
  }
}

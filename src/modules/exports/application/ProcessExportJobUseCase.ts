import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { ConceptBoardRepository } from "@/modules/conceptBoards/domain/ConceptBoardRepository";
import type { GenerationRepository } from "@/modules/generations/domain/GenerationRepository";
import type { MockupRepository } from "@/modules/mockups/domain/MockupRepository";
import type { ExportRepository } from "@/modules/exports/domain/ExportRepository";
import type { ExportJob } from "@/modules/exports/domain/Export";
import type { ExportRenderer, RenderedFile } from "@/modules/exports/domain/ExportRenderer";
import type { FileStorage } from "@/shared/storage/FileStorage";
import type { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import { EXPORT_EVENT_TYPE } from "@/modules/subscriptions/domain/planLimits";
import { recordActivity } from "@/shared/activity/activityLogger";
import { logger } from "@/shared/logging/logger";

/** The actual render work, run inside the BullMQ Worker -- mirrors the other Process*JobUseCase workers. */
export class ProcessExportJobUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly conceptBoardRepository: ConceptBoardRepository,
    private readonly generationRepository: GenerationRepository,
    private readonly mockupRepository: MockupRepository,
    private readonly exportRepository: ExportRepository,
    private readonly renderer: ExportRenderer,
    private readonly fileStorage: FileStorage,
    private readonly recordUsageUseCase: RecordUsageUseCase,
  ) {}

  async execute(input: { exportId: string; isFinalAttempt: boolean; requestedByUserId: string }): Promise<void> {
    const job = await this.exportRepository.getById(input.exportId);
    if (!job) return;
    const project = await this.projectRepository.findById(job.projectId);
    if (!project) return;

    await this.exportRepository.updateResult(job.id, { status: "processing" });

    try {
      const file = await this.renderContent(job, project.name);

      const saved = await this.fileStorage.save(`exports/${job.projectId}/${job.id}`, file.buffer, file.contentType);

      await this.exportRepository.updateResult(job.id, {
        status: "completed",
        fileKey: saved.key,
        fileSizeBytes: saved.sizeBytes,
        completedAt: new Date(),
      });

      await this.recordUsageUseCase.execute({
        userId: input.requestedByUserId,
        projectId: job.projectId,
        eventType: EXPORT_EVENT_TYPE,
        quantity: 1,
      });

      await recordActivity({
        userId: input.requestedByUserId,
        projectId: job.projectId,
        eventType: "EXPORT_COMPLETED",
        payload: { exportId: job.id, source: job.source, format: job.format },
      });
    } catch (err) {
      logger.error("Export job failed", {
        exportId: job.id,
        isFinalAttempt: input.isFinalAttempt,
        details: err instanceof Error ? err.message : String(err),
      });

      if (!input.isFinalAttempt) {
        throw err;
      }

      const errorMessage = err instanceof Error ? err.message : "Export에 실패했습니다.";
      await this.exportRepository.updateResult(job.id, { status: "failed", errorMessage });
      await recordActivity({
        userId: input.requestedByUserId,
        projectId: job.projectId,
        eventType: "EXPORT_FAILED",
        payload: { exportId: job.id },
      });
    }
  }

  private async renderContent(job: ExportJob, brandName: string): Promise<RenderedFile> {
    if (job.source === "concept_board") {
      const board = await this.conceptBoardRepository.findByProjectId(job.projectId);
      if (!board) {
        throw new Error("Concept Board를 찾을 수 없습니다.");
      }
      return this.renderer.renderConceptBoardPdf({
        data: board.currentVersion.data,
        brandName,
        sections: job.sections,
        includeBrandInfo: job.includeBrandInfo,
        watermark: job.watermarked,
      });
    }

    if (job.source === "generation") {
      const version = job.sourceRefId ? await this.generationRepository.getVersionById(job.sourceRefId) : null;
      const imageUrl = version?.images[0]?.url;
      if (!imageUrl) {
        throw new Error("내보낼 이미지를 찾을 수 없습니다.");
      }
      return this.renderer.renderImage({
        imageUrl,
        format: job.format === "pdf" ? "png" : job.format,
        watermark: job.watermarked,
      });
    }

    const mockup = job.sourceRefId ? await this.mockupRepository.getById(job.sourceRefId) : null;
    if (!mockup?.resultImageUrl) {
      throw new Error("내보낼 목업 이미지를 찾을 수 없습니다.");
    }
    return this.renderer.renderImage({
      imageUrl: mockup.resultImageUrl,
      format: job.format === "pdf" ? "png" : job.format,
      watermark: job.watermarked,
    });
  }
}

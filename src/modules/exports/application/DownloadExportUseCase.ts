import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { ExportRepository } from "@/modules/exports/domain/ExportRepository";
import type { FileStorage } from "@/shared/storage/FileStorage";
import { ConflictError, NotFoundError } from "@/shared/errors/AppError";

export class DownloadExportUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly exportRepository: ExportRepository,
    private readonly fileStorage: FileStorage,
  ) {}

  async execute(input: { exportId: string; userId: string }): Promise<{ data: Buffer; contentType: string; fileKey: string }> {
    const job = await this.exportRepository.getById(input.exportId);
    if (!job) {
      throw new NotFoundError("Export 요청을 찾을 수 없습니다.", "EXPORT_NOT_FOUND");
    }
    const project = await this.projectRepository.findByIdForUser(job.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("Export 요청을 찾을 수 없습니다.", "EXPORT_NOT_FOUND");
    }
    if (job.status !== "completed" || !job.fileKey) {
      throw new ConflictError("아직 다운로드할 수 없습니다.", "EXPORT-002");
    }

    const file = await this.fileStorage.read(job.fileKey);
    if (!file) {
      throw new NotFoundError("파일을 찾을 수 없습니다.", "EXPORT_FILE_NOT_FOUND");
    }

    return { ...file, fileKey: job.fileKey };
  }
}

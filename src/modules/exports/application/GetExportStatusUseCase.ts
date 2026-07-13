import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { ExportRepository } from "@/modules/exports/domain/ExportRepository";
import type { ExportJob } from "@/modules/exports/domain/Export";
import { NotFoundError } from "@/shared/errors/AppError";

export class GetExportStatusUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly exportRepository: ExportRepository,
  ) {}

  async execute(input: { exportId: string; userId: string }): Promise<ExportJob> {
    const job = await this.exportRepository.getById(input.exportId);
    if (!job) {
      throw new NotFoundError("Export 요청을 찾을 수 없습니다.", "EXPORT_NOT_FOUND");
    }
    const project = await this.projectRepository.findByIdForUser(job.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("Export 요청을 찾을 수 없습니다.", "EXPORT_NOT_FOUND");
    }

    return job;
  }
}

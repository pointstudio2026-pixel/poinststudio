import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { ExportRepository } from "@/modules/exports/domain/ExportRepository";
import type { ExportJob } from "@/modules/exports/domain/Export";
import { NotFoundError } from "@/shared/errors/AppError";

export class GetExportsUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly exportRepository: ExportRepository,
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<ExportJob[]> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    return this.exportRepository.listByProjectId(input.projectId);
  }
}

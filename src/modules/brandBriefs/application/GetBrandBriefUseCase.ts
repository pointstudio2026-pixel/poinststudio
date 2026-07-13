import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { BrandBriefRepository } from "@/modules/brandBriefs/domain/BrandBriefRepository";
import type { BrandBrief, BrandBriefVersion } from "@/modules/brandBriefs/domain/BrandBrief";
import { NotFoundError } from "@/shared/errors/AppError";

export interface GetBrandBriefOutput {
  brief: BrandBrief;
  versions: BrandBriefVersion[];
}

export class GetBrandBriefUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly brandBriefRepository: BrandBriefRepository,
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<GetBrandBriefOutput> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const brief = await this.brandBriefRepository.findByProjectId(input.projectId);
    if (!brief) {
      throw new NotFoundError("Brand Brief가 아직 생성되지 않았습니다.", "BRAND_BRIEF_NOT_FOUND");
    }

    const versions = await this.brandBriefRepository.listVersions(brief.id);
    return { brief, versions };
  }
}

import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { BrandStrategyRepository } from "@/modules/brandStrategies/domain/BrandStrategyRepository";
import type { BrandStrategy, BrandStrategyVersion } from "@/modules/brandStrategies/domain/BrandStrategy";
import { NotFoundError } from "@/shared/errors/AppError";

export interface GetBrandStrategyOutput {
  strategy: BrandStrategy;
  versions: BrandStrategyVersion[];
}

export class GetBrandStrategyUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly brandStrategyRepository: BrandStrategyRepository,
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<GetBrandStrategyOutput> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const strategy = await this.brandStrategyRepository.findByProjectId(input.projectId);
    if (!strategy) {
      throw new NotFoundError("Brand Strategy가 아직 생성되지 않았습니다.", "BRAND_STRATEGY_NOT_FOUND");
    }

    const versions = await this.brandStrategyRepository.listVersions(strategy.id);
    return { strategy, versions };
  }
}

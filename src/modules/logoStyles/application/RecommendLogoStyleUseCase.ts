import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { BrandStrategyRepository } from "@/modules/brandStrategies/domain/BrandStrategyRepository";
import type { LogoStyleCategoryRepository } from "@/modules/logoStyles/domain/LogoStyleCategoryRepository";
import type { LogoStyleRecommendation } from "@/modules/logoStyles/domain/LogoStyle";
import { rankLogoStyleCategories } from "@/modules/logoStyles/domain/logoStyleRules";
import { ConflictError, NotFoundError } from "@/shared/errors/AppError";

export class RecommendLogoStyleUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly brandStrategyRepository: BrandStrategyRepository,
    private readonly categoryRepository: LogoStyleCategoryRepository,
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<LogoStyleRecommendation[]> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const strategy = await this.brandStrategyRepository.findByProjectId(input.projectId);
    if (!strategy || strategy.currentVersion.selectedIndex === null) {
      throw new ConflictError(
        "브랜드 전략을 먼저 선택해야 로고 스타일을 추천받을 수 있습니다.",
        "BRAND_STRATEGY_SELECTION_REQUIRED",
      );
    }

    const { brandKnowledge, brandStrategy } = strategy.currentVersion.data;
    const brandText = [
      brandKnowledge.tone,
      brandKnowledge.personality,
      brandKnowledge.positioning,
      brandKnowledge.values.join(" "),
      brandKnowledge.keywords.join(" "),
      brandStrategy.brandArchetype,
      brandStrategy.toneAndManner,
    ].join(" ");

    const categories = await this.categoryRepository.listAll();
    return rankLogoStyleCategories(categories, { brandText });
  }
}

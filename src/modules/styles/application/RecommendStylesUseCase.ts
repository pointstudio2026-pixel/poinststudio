import type { ProjectRepository } from "@/modules/projects/domain/ProjectRepository";
import type { BrandStrategyRepository } from "@/modules/brandStrategies/domain/BrandStrategyRepository";
import type { StyleRepository } from "@/modules/styles/domain/StyleRepository";
import type { StyleRecommendation } from "@/modules/styles/domain/Style";
import { MAX_RECOMMENDATIONS, buildRecommendationReason, scoreStyle } from "@/modules/styles/domain/styleRules";
import { ConflictError, NotFoundError } from "@/shared/errors/AppError";

export class RecommendStylesUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly brandStrategyRepository: BrandStrategyRepository,
    private readonly styleRepository: StyleRepository,
  ) {}

  async execute(input: { projectId: string; userId: string }): Promise<StyleRecommendation[]> {
    const project = await this.projectRepository.findByIdForUser(input.projectId, input.userId);
    if (!project) {
      throw new NotFoundError("프로젝트를 찾을 수 없습니다.", "PROJECT_NOT_FOUND");
    }

    const strategy = await this.brandStrategyRepository.findByProjectId(input.projectId);
    if (!strategy) {
      throw new ConflictError(
        "Brand Strategy를 먼저 생성해야 스타일을 추천받을 수 있습니다.",
        "BRAND_STRATEGY_REQUIRED",
      );
    }

    const { brandKnowledge, brandStrategy, styleCandidates } = strategy.currentVersion.data;
    const candidateCategoryNames = styleCandidates.map((c) => c.name);
    const keywordText = [
      brandKnowledge.tone,
      brandKnowledge.personality,
      brandKnowledge.positioning,
      brandKnowledge.values.join(" "),
      brandStrategy.brandArchetype,
    ].join(" ");

    const leafStyles = await this.styleRepository.list({ level: 3 });
    const scored = leafStyles
      .map((style) => ({
        style,
        score: scoreStyle(style, { candidateCategoryNames, keywordText }),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RECOMMENDATIONS);

    const recommendations: StyleRecommendation[] = [];
    for (const { style, score } of scored) {
      const alternatives = style.parentId
        ? await this.styleRepository.listSiblings(style.parentId, style.id, 3)
        : [];
      recommendations.push({
        style,
        score,
        reason: buildRecommendationReason(style, { candidateCategoryNames, keywordText }),
        alternatives,
      });
    }

    return recommendations;
  }
}

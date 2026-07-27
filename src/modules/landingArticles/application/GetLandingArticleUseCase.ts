import type { LandingArticleRepository } from "@/modules/landingArticles/domain/LandingArticleRepository";
import type { LandingArticle } from "@/modules/landingArticles/domain/LandingArticle";
import { NotFoundError } from "@/shared/errors/AppError";

export class GetLandingArticleUseCase {
  constructor(private readonly landingArticleRepository: LandingArticleRepository) {}

  async execute(input: { slug: string; locale: string }): Promise<LandingArticle> {
    const article = await this.landingArticleRepository.findBySlugAndLocale(input.slug, input.locale);
    if (!article) {
      throw new NotFoundError("가이드를 찾을 수 없습니다.", "LANDING_ARTICLE_NOT_FOUND");
    }
    return article;
  }
}

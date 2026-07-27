import type { LandingArticleRepository } from "@/modules/landingArticles/domain/LandingArticleRepository";
import type { LandingArticle } from "@/modules/landingArticles/domain/LandingArticle";

export class ListLandingArticlesUseCase {
  constructor(private readonly landingArticleRepository: LandingArticleRepository) {}

  async execute(input: { locale: string; category?: string }): Promise<LandingArticle[]> {
    return this.landingArticleRepository.listPublished(input);
  }
}

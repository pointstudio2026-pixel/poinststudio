import type { LandingArticleRepository } from "@/modules/landingArticles/domain/LandingArticleRepository";
import type { LandingArticle } from "@/modules/landingArticles/domain/LandingArticle";

/** 빈 문자열/공백만 있는 검색어는 결과 없음으로 처리한다(전체 글이 쏟아지는 것 방지). */
export class SearchLandingArticlesUseCase {
  constructor(private readonly landingArticleRepository: LandingArticleRepository) {}

  async execute(input: { locale: string; query: string }): Promise<LandingArticle[]> {
    const trimmed = input.query.trim();
    if (!trimmed) return [];
    return this.landingArticleRepository.searchPublished(input.locale, trimmed);
  }
}

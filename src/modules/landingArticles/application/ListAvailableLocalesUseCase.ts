import type { LandingArticleRepository } from "@/modules/landingArticles/domain/LandingArticleRepository";

export class ListAvailableLocalesUseCase {
  constructor(private readonly landingArticleRepository: LandingArticleRepository) {}

  async execute(input: { slug: string }): Promise<string[]> {
    return this.landingArticleRepository.findPublishedLocales(input.slug);
  }
}

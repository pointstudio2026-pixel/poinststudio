import { describe, expect, it } from "vitest";
import { SearchLandingArticlesUseCase } from "@/modules/landingArticles/application/SearchLandingArticlesUseCase";
import { PublishLandingArticleUseCase } from "@/modules/landingArticles/application/PublishLandingArticleUseCase";
import { FakeLandingArticleRepository } from "@/modules/landingArticles/testing/fakes";
import type { LandingArticleContent } from "@/modules/landingArticles/domain/LandingArticle";

const sampleContent: LandingArticleContent = {
  definition: "정의",
  images: [],
  industryFit: [],
  detailSpec: [],
  combos: [],
  faq: [],
  ctaLabel: "시작하기",
  ctaHref: "/register",
};

describe("SearchLandingArticlesUseCase", () => {
  it("matches on displayTitle, case-insensitively", async () => {
    const repository = new FakeLandingArticleRepository();
    const publish = new PublishLandingArticleUseCase(repository);
    await publish.execute({
      slug: "style-modern",
      category: "style",
      locale: "ko",
      title: "모던 로고 스타일 완벽 가이드",
      displayTitle: "모던 로고 스타일",
      metaDescription: "설명",
      status: "published",
      content: sampleContent,
    });

    const useCase = new SearchLandingArticlesUseCase(repository);
    const results = await useCase.execute({ locale: "ko", query: "모던" });

    expect(results).toHaveLength(1);
    expect(results[0]?.slug).toBe("style-modern");
  });

  it("returns no results for a blank query instead of every article", async () => {
    const repository = new FakeLandingArticleRepository();
    const publish = new PublishLandingArticleUseCase(repository);
    await publish.execute({
      slug: "style-modern",
      category: "style",
      locale: "ko",
      title: "모던",
      displayTitle: "모던",
      metaDescription: "설명",
      status: "published",
      content: sampleContent,
    });

    const useCase = new SearchLandingArticlesUseCase(repository);
    const results = await useCase.execute({ locale: "ko", query: "   " });

    expect(results).toHaveLength(0);
  });

  it("does not match draft articles", async () => {
    const repository = new FakeLandingArticleRepository();
    const publish = new PublishLandingArticleUseCase(repository);
    await publish.execute({
      slug: "style-draft",
      category: "style",
      locale: "ko",
      title: "미공개 초안",
      displayTitle: "미공개 초안",
      metaDescription: "설명",
      status: "draft",
      content: sampleContent,
    });

    const useCase = new SearchLandingArticlesUseCase(repository);
    const results = await useCase.execute({ locale: "ko", query: "초안" });

    expect(results).toHaveLength(0);
  });
});

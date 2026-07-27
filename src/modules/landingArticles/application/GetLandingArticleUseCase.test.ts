import { describe, expect, it } from "vitest";
import { GetLandingArticleUseCase } from "@/modules/landingArticles/application/GetLandingArticleUseCase";
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

describe("GetLandingArticleUseCase", () => {
  it("returns a published article", async () => {
    const repository = new FakeLandingArticleRepository();
    await new PublishLandingArticleUseCase(repository).execute({
      slug: "style-modern",
      category: "style",
      locale: "ko",
      title: "모던 스타일",
      displayTitle: "모던 스타일",
      metaDescription: "설명",
      status: "published",
      content: sampleContent,
    });

    const useCase = new GetLandingArticleUseCase(repository);
    const article = await useCase.execute({ slug: "style-modern", locale: "ko" });

    expect(article.slug).toBe("style-modern");
  });

  it("throws NotFoundError for a draft article", async () => {
    const repository = new FakeLandingArticleRepository();
    await new PublishLandingArticleUseCase(repository).execute({
      slug: "style-draft",
      category: "style",
      locale: "ko",
      title: "초안",
      displayTitle: "초안",
      metaDescription: "설명",
      status: "draft",
      content: sampleContent,
    });

    const useCase = new GetLandingArticleUseCase(repository);
    await expect(useCase.execute({ slug: "style-draft", locale: "ko" })).rejects.toThrow();
  });

  it("throws NotFoundError for an unknown slug", async () => {
    const repository = new FakeLandingArticleRepository();
    const useCase = new GetLandingArticleUseCase(repository);
    await expect(useCase.execute({ slug: "does-not-exist", locale: "ko" })).rejects.toThrow();
  });
});

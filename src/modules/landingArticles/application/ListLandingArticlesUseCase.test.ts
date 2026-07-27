import { describe, expect, it } from "vitest";
import { ListLandingArticlesUseCase } from "@/modules/landingArticles/application/ListLandingArticlesUseCase";
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

describe("ListLandingArticlesUseCase", () => {
  it("only lists published articles for the given locale", async () => {
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
    await publish.execute({
      slug: "style-draft",
      category: "style",
      locale: "ko",
      title: "초안",
      displayTitle: "초안",
      metaDescription: "설명",
      status: "draft",
      content: sampleContent,
    });
    await publish.execute({
      slug: "style-modern",
      category: "style",
      locale: "en",
      title: "Modern",
      displayTitle: "Modern",
      metaDescription: "desc",
      status: "published",
      content: sampleContent,
    });

    const useCase = new ListLandingArticlesUseCase(repository);
    const koArticles = await useCase.execute({ locale: "ko" });

    expect(koArticles).toHaveLength(1);
    expect(koArticles[0]?.slug).toBe("style-modern");
  });

  it("filters by category when provided", async () => {
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
    await publish.execute({
      slug: "industry-cafe",
      category: "style-industry",
      locale: "ko",
      title: "카페",
      displayTitle: "카페",
      metaDescription: "설명",
      status: "published",
      content: sampleContent,
    });

    const useCase = new ListLandingArticlesUseCase(repository);
    const styleArticles = await useCase.execute({ locale: "ko", category: "style" });

    expect(styleArticles).toHaveLength(1);
    expect(styleArticles[0]?.slug).toBe("style-modern");
  });
});

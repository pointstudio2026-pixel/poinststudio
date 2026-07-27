import { describe, expect, it } from "vitest";
import { ListAvailableLocalesUseCase } from "@/modules/landingArticles/application/ListAvailableLocalesUseCase";
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

describe("ListAvailableLocalesUseCase", () => {
  it("returns only published locales for a slug", async () => {
    const repository = new FakeLandingArticleRepository();
    const publish = new PublishLandingArticleUseCase(repository);
    await publish.execute({
      slug: "style-modern",
      category: "style",
      locale: "ko",
      title: "모던 스타일",
      displayTitle: "모던 스타일",
      metaDescription: "설명",
      status: "published",
      content: sampleContent,
    });
    await publish.execute({
      slug: "style-modern",
      category: "style",
      locale: "en",
      title: "Modern style",
      displayTitle: "Modern style",
      metaDescription: "desc",
      status: "published",
      content: sampleContent,
    });
    await publish.execute({
      slug: "style-modern",
      category: "style",
      locale: "ja",
      title: "モダンスタイル",
      displayTitle: "モダンスタイル",
      metaDescription: "desc",
      status: "draft",
      content: sampleContent,
    });

    const useCase = new ListAvailableLocalesUseCase(repository);
    const locales = await useCase.execute({ slug: "style-modern" });

    expect(locales.sort()).toEqual(["en", "ko"]);
  });

  it("returns an empty array for an unknown slug", async () => {
    const repository = new FakeLandingArticleRepository();
    const useCase = new ListAvailableLocalesUseCase(repository);
    expect(await useCase.execute({ slug: "does-not-exist" })).toEqual([]);
  });
});

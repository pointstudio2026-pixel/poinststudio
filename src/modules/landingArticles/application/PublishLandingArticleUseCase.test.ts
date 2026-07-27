import { describe, expect, it } from "vitest";
import { PublishLandingArticleUseCase } from "@/modules/landingArticles/application/PublishLandingArticleUseCase";
import { FakeLandingArticleRepository } from "@/modules/landingArticles/testing/fakes";
import type { LandingArticleContent } from "@/modules/landingArticles/domain/LandingArticle";

const sampleContent: LandingArticleContent = {
  definition: "모던 스타일은...",
  images: [{ url: "https://example.com/a.png", alt: "샘플 이미지" }],
  industryFit: [{ industry: "카페", reason: "깔끔한 느낌" }],
  detailSpec: [{ label: "여백", value: "넓게" }],
  combos: [{ slug: "style-minimal", label: "미니멀" }],
  faq: [{ question: "얼마나 걸리나요?", answer: "1분 내외" }],
  ctaLabel: "무료로 시작하기",
  ctaHref: "/register",
};

function buildInput(overrides: Partial<Parameters<PublishLandingArticleUseCase["execute"]>[0]> = {}) {
  return {
    slug: "style-modern",
    category: "style",
    locale: "ko",
    title: "모던 스타일이란?",
    displayTitle: "모던 스타일 가이드",
    metaDescription: "모던 스타일의 정의와 어울리는 업종을 소개합니다.",
    status: "published" as const,
    content: sampleContent,
    ...overrides,
  };
}

describe("PublishLandingArticleUseCase", () => {
  it("creates a new group and translation on first publish", async () => {
    const repository = new FakeLandingArticleRepository();
    const useCase = new PublishLandingArticleUseCase(repository);

    const article = await useCase.execute(buildInput());

    expect(article.slug).toBe("style-modern");
    expect(article.category).toBe("style");
    expect(article.status).toBe("published");
    expect(article.publishedAt).not.toBeNull();
    expect(repository.groups).toHaveLength(1);
  });

  it("does not overwrite category on a later upsert of a different locale", async () => {
    const repository = new FakeLandingArticleRepository();
    const useCase = new PublishLandingArticleUseCase(repository);

    await useCase.execute(buildInput({ locale: "ko", category: "style" }));
    const enArticle = await useCase.execute(buildInput({ locale: "en", category: "totally-different" }));

    expect(enArticle.category).toBe("style");
    expect(repository.groups).toHaveLength(1);
  });

  it("keeps the original publishedAt across a republish", async () => {
    const repository = new FakeLandingArticleRepository();
    const useCase = new PublishLandingArticleUseCase(repository);

    const first = await useCase.execute(buildInput());
    const firstPublishedAt = first.publishedAt;

    const second = await useCase.execute(buildInput({ title: "수정된 제목" }));

    expect(second.publishedAt?.getTime()).toBe(firstPublishedAt?.getTime());
    expect(second.title).toBe("수정된 제목");
  });

  it("throws ValidationError for an unsupported locale", async () => {
    const repository = new FakeLandingArticleRepository();
    const useCase = new PublishLandingArticleUseCase(repository);

    await expect(useCase.execute(buildInput({ locale: "zh" }))).rejects.toThrow();
  });

  it("throws ValidationError when required fields are missing", async () => {
    const repository = new FakeLandingArticleRepository();
    const useCase = new PublishLandingArticleUseCase(repository);

    await expect(useCase.execute(buildInput({ slug: "" }))).rejects.toThrow();
  });
});

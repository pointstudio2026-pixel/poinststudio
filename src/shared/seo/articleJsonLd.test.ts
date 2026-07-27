import { describe, expect, it } from "vitest";
import { buildArticleJsonLd, buildBreadcrumbJsonLd, buildFaqPageJsonLd } from "@/shared/seo/articleJsonLd";
import type { LandingArticle, StyleGuideContent } from "@/modules/landingArticles/domain/LandingArticle";

const STYLE_ARTICLE: LandingArticle = {
  slug: "handcrafted-warm",
  category: "style",
  locale: "ko",
  title: "핸드크래프트 웜 스타일 가이드",
  displayTitle: "핸드크래프트 웜",
  metaDescription: "핸드크래프트 웜 스타일 소개",
  status: "published",
  publishedAt: new Date("2026-07-27"),
  content: {
    definition: "핸드크래프트 웜은 오가닉하고 따뜻한 무드의 스타일입니다.",
    images: [],
    industryFit: [],
    detailSpec: [],
    combos: [],
    faq: [{ question: "어떤 업종에 어울리나요?", answer: "카페, 베이커리 등에 잘 어울립니다." }],
    ctaLabel: "시작하기",
    ctaHref: "/register",
  } satisfies StyleGuideContent,
};

describe("buildArticleJsonLd", () => {
  it("produces a valid Article schema with the correct canonical URL", () => {
    const result = buildArticleJsonLd("ko", STYLE_ARTICLE);
    expect(result["@type"]).toBe("Article");
    expect(result.headline).toBe(STYLE_ARTICLE.title);
    expect(result.url).toBe("https://www.designaster.com/guides/handcrafted-warm");
    expect(result.articleBody).toContain("오가닉하고 따뜻한");
  });
});

describe("buildFaqPageJsonLd", () => {
  it("builds a FAQPage schema from a style guide's embedded faq array", () => {
    const result = buildFaqPageJsonLd(STYLE_ARTICLE);
    expect(result).not.toBeNull();
    expect(result?.["@type"]).toBe("FAQPage");
    expect(result?.mainEntity).toHaveLength(1);
    expect(result?.mainEntity[0].name).toBe("어떤 업종에 어울리나요?");
  });

  it("returns null for non-style categories (no embedded faq array to source from)", () => {
    const faqArticle: LandingArticle = { ...STYLE_ARTICLE, category: "faq" };
    expect(buildFaqPageJsonLd(faqArticle)).toBeNull();
  });

  it("returns null when the style guide has no faq entries", () => {
    const noFaq: LandingArticle = {
      ...STYLE_ARTICLE,
      content: { ...(STYLE_ARTICLE.content as StyleGuideContent), faq: [] },
    };
    expect(buildFaqPageJsonLd(noFaq)).toBeNull();
  });
});

describe("buildBreadcrumbJsonLd", () => {
  it("includes a hub crumb for style/faq categories", () => {
    const result = buildBreadcrumbJsonLd("ko", STYLE_ARTICLE);
    expect(result.itemListElement).toHaveLength(3);
    expect(result.itemListElement[1].name).toBe("Guides");
  });

  it("skips the hub crumb for why-aster (no hub link exists in the UI either)", () => {
    const whyAster: LandingArticle = { ...STYLE_ARTICLE, category: "why-aster" };
    const result = buildBreadcrumbJsonLd("ko", whyAster);
    expect(result.itemListElement).toHaveLength(2);
  });
});

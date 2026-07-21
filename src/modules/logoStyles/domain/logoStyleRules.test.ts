import { describe, expect, it } from "vitest";
import { rankLogoStyleCategories, scoreLogoStyleCategory } from "@/modules/logoStyles/domain/logoStyleRules";
import type { LogoStyleCategory } from "@/modules/logoStyles/domain/LogoStyle";

function makeCategory(overrides: Partial<LogoStyleCategory>): LogoStyleCategory {
  return {
    id: overrides.id ?? "cat",
    slug: overrides.slug ?? "cat",
    name: overrides.name ?? "카테고리",
    description: overrides.description ?? "설명",
    subStyles: overrides.subStyles ?? ["서브스타일"],
    keywords: overrides.keywords ?? [],
    sampleImageUrl: overrides.sampleImageUrl ?? "/logo-styles/sample.svg",
    sortOrder: overrides.sortOrder ?? 0,
  };
}

describe("scoreLogoStyleCategory", () => {
  it("returns 0 when a category has no keywords defined", () => {
    const category = makeCategory({ keywords: [] });
    expect(scoreLogoStyleCategory(category, { brandText: "미니멀하고 심플한 브랜드" })).toBe(0);
  });

  it("scores the ratio of matched keywords, case-insensitively", () => {
    const category = makeCategory({ keywords: ["미니멀", "심볼", "기하학"] });
    const score = scoreLogoStyleCategory(category, { brandText: "MINIMAL하고 심볼 중심의 브랜드입니다" });
    expect(score).toBe(0.33);
  });

  it("scores 1 when every keyword matches", () => {
    const category = makeCategory({ keywords: ["따뜻함", "친근함"] });
    const score = scoreLogoStyleCategory(category, { brandText: "따뜻함과 친근함이 느껴지는 동네 베이커리" });
    expect(score).toBe(1);
  });
});

describe("rankLogoStyleCategories", () => {
  it("ranks the best keyword match first and attaches a representative sub-style", () => {
    const categories = [
      makeCategory({ id: "typo", keywords: ["레터마크"], subStyles: ["워드마크", "레터마크"] }),
      makeCategory({ id: "symbol", keywords: ["미니멀", "기하학"], subStyles: ["미니멀심볼", "기하학심볼"] }),
    ];

    const ranked = rankLogoStyleCategories(categories, { brandText: "미니멀하고 기하학적인 심볼을 원합니다" });

    expect(ranked[0]?.category.id).toBe("symbol");
    expect(ranked[0]?.representativeSubStyle).toBe("미니멀심볼");
    expect(ranked[0]?.reason).toContain("미니멀");
  });

  it("falls back to the category name as the representative style when no sub-styles exist", () => {
    const categories = [makeCategory({ id: "bare", name: "빈 카테고리", subStyles: [] })];
    const ranked = rankLogoStyleCategories(categories, { brandText: "아무 텍스트" });
    expect(ranked[0]?.representativeSubStyle).toBe("빈 카테고리");
  });

  it("gives a generic reason when no keywords match", () => {
    const categories = [makeCategory({ id: "c1", name: "프리미엄 스타일", keywords: ["그라디언트"] })];
    const ranked = rankLogoStyleCategories(categories, { brandText: "동네 빵집" });
    expect(ranked[0]?.reason).toContain("두루 어울리는");
  });
});

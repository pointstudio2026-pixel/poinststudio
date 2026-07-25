import { describe, expect, it } from "vitest";
import { MOCKUP_CATEGORIES } from "@/modules/mockups/domain/Mockup";
import {
  DELIVERABLE_TYPE_TO_MOCKUP_CATEGORY,
  buildMockupCategorySceneDirective,
  rankMockupCategories,
  scoreMockupCategory,
} from "@/modules/mockups/domain/mockupRules";

describe("mockupRules", () => {
  it("ranks business_card highest for a B2B/consulting keyword text", () => {
    const ranked = rankMockupCategories([...MOCKUP_CATEGORIES], { keywordText: "명함이 필요한 컨설팅 회사입니다" });
    expect(ranked[0]!.category).toBe("business_card");
    expect(ranked[0]!.score).toBeGreaterThan(0);
  });

  it("ranks signboard highest for a storefront/cafe keyword text", () => {
    const ranked = rankMockupCategories([...MOCKUP_CATEGORIES], { keywordText: "카페 매장 간판이 필요해요" });
    expect(ranked[0]!.category).toBe("signboard");
  });

  it("ranks mobile_app highest for a tech startup keyword text", () => {
    const ranked = rankMockupCategories([...MOCKUP_CATEGORIES], { keywordText: "IT 스타트업 앱 서비스 플랫폼" });
    expect(ranked[0]!.category).toBe("mobile_app");
  });

  it("ranks brochure highest for a catalog/consulting keyword text", () => {
    const ranked = rankMockupCategories([...MOCKUP_CATEGORIES], { keywordText: "브로슈어 카탈로그 인테리어 상담" });
    expect(ranked[0]!.category).toBe("brochure");
  });

  it("ranks poster highest for an event/promo keyword text", () => {
    const ranked = rankMockupCategories([...MOCKUP_CATEGORIES], { keywordText: "포스터 홍보 이벤트 캠페인" });
    expect(ranked[0]!.category).toBe("poster");
  });

  it("scores 0 for unrelated text with no keyword matches", () => {
    const score = scoreMockupCategory("business_card", { keywordText: "xyz123 completely unrelated" });
    expect(score).toBe(0);
  });

  it("preserves original order when every category scores 0", () => {
    const ranked = rankMockupCategories([...MOCKUP_CATEGORIES], { keywordText: "" });
    expect(ranked.map((r) => r.category)).toEqual(MOCKUP_CATEGORIES);
  });

  it("ranks package highest for a product/F&B packaging keyword text (2026-07-25 신규 카테고리)", () => {
    const ranked = rankMockupCategories([...MOCKUP_CATEGORIES], { keywordText: "식품 패키지 포장 박스 디자인" });
    expect(ranked[0]!.category).toBe("package");
  });

  it("ranks leaflet highest for a flyer/event keyword text", () => {
    const ranked = rankMockupCategories([...MOCKUP_CATEGORIES], { keywordText: "리플렛 전단 행사 소개" });
    expect(ranked[0]!.category).toBe("leaflet");
  });

  it("ranks banner highest for an SNS ad keyword text", () => {
    const ranked = rankMockupCategories([...MOCKUP_CATEGORIES], { keywordText: "SNS 배너 소셜 마케팅 광고" });
    expect(ranked[0]!.category).toBe("banner");
  });

  it("ranks uniform highest for a cafe staff apron keyword text", () => {
    const ranked = rankMockupCategories([...MOCKUP_CATEGORIES], { keywordText: "유니폼 앞치마 직원 서비스업" });
    expect(ranked[0]!.category).toBe("uniform");
  });
});

describe("DELIVERABLE_TYPE_TO_MOCKUP_CATEGORY", () => {
  it("maps 패키지 and 리플렛 to their new mockup categories (2026-07-25)", () => {
    expect(DELIVERABLE_TYPE_TO_MOCKUP_CATEGORY["패키지"]).toBe("package");
    expect(DELIVERABLE_TYPE_TO_MOCKUP_CATEGORY["리플렛"]).toBe("leaflet");
  });

  it("leaves banner/uniform unmapped (bonus categories shown across all branding projects)", () => {
    expect(Object.values(DELIVERABLE_TYPE_TO_MOCKUP_CATEGORY)).not.toContain("banner");
    expect(Object.values(DELIVERABLE_TYPE_TO_MOCKUP_CATEGORY)).not.toContain("uniform");
  });
});

describe("buildMockupCategorySceneDirective (2026-07-25 신설)", () => {
  it("returns a non-empty scene directive for every mockup category", () => {
    for (const category of MOCKUP_CATEGORIES) {
      expect(buildMockupCategorySceneDirective(category).length).toBeGreaterThan(0);
    }
  });

  it("gives each category a distinct directive (no accidental copy-paste duplicates)", () => {
    const directives = MOCKUP_CATEGORIES.map((c) => buildMockupCategorySceneDirective(c));
    expect(new Set(directives).size).toBe(MOCKUP_CATEGORIES.length);
  });
});

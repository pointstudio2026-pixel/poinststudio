import { describe, expect, it } from "vitest";
import { MOCKUP_CATEGORIES } from "@/modules/mockups/domain/Mockup";
import { rankMockupCategories, scoreMockupCategory } from "@/modules/mockups/domain/mockupRules";

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
});

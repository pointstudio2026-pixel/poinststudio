import { describe, expect, it } from "vitest";
import { MOCKUP_CATEGORIES } from "@/modules/mockups/domain/Mockup";
import { rankMockupCategories, scoreMockupCategory } from "@/modules/mockups/domain/mockupRules";

describe("mockupRules", () => {
  it("ranks coffee_cup highest for a cafe-related keyword text", () => {
    const ranked = rankMockupCategories([...MOCKUP_CATEGORIES], { keywordText: "카페 커피 로스터리" });
    expect(ranked[0]!.category).toBe("coffee_cup");
    expect(ranked[0]!.score).toBeGreaterThan(0);
  });

  it("ranks packaging highest for a cosmetics-related keyword text", () => {
    const ranked = rankMockupCategories([...MOCKUP_CATEGORIES], { keywordText: "화장품 스킨케어 코스메틱" });
    expect(ranked[0]!.category).toBe("packaging");
  });

  it("ranks mobile_app / website_hero highest for a tech startup keyword text", () => {
    const ranked = rankMockupCategories([...MOCKUP_CATEGORIES], { keywordText: "IT 스타트업 앱 서비스" });
    expect(["mobile_app", "website_hero"]).toContain(ranked[0]!.category);
  });

  it("scores 0 for unrelated text with no keyword matches", () => {
    const score = scoreMockupCategory("coffee_cup", { keywordText: "xyz123 completely unrelated" });
    expect(score).toBe(0);
  });

  it("preserves original order when every category scores 0", () => {
    const ranked = rankMockupCategories([...MOCKUP_CATEGORIES], { keywordText: "" });
    expect(ranked.map((r) => r.category)).toEqual(MOCKUP_CATEGORIES);
  });
});

import { describe, expect, it } from "vitest";
import type { Style } from "@/modules/styles/domain/Style";
import {
  buildRecommendationReason,
  buildStyleCandidatesFromAnswers,
  categoriesConflict,
  findConflict,
  scoreStyle,
} from "@/modules/styles/domain/styleRules";

function makeStyle(overrides: Partial<Style> = {}): Style {
  return {
    id: "style-1",
    name: "미니멀 볼드",
    slug: "minimal-bold",
    level: 3,
    parentId: "parent-1",
    category: "미니멀",
    keywords: ["미니멀", "여백", "강렬한"],
    description: "미니멀 계열의 볼드 스타일입니다.",
    ...overrides,
  };
}

describe("scoreStyle", () => {
  it("scores highest when the style's category matches the primary candidate", () => {
    const style = makeStyle();
    const score = scoreStyle(style, {
      candidateCategoryNames: ["미니멀", "모던"],
      keywordText: "친근하고 따뜻한 카페",
    });
    expect(score).toBeGreaterThanOrEqual(0.6);
  });

  it("scores lower for a secondary candidate match than a primary match", () => {
    const style = makeStyle();
    const primaryScore = scoreStyle(style, {
      candidateCategoryNames: ["미니멀"],
      keywordText: "",
    });
    const secondaryScore = scoreStyle(style, {
      candidateCategoryNames: ["모던", "미니멀"],
      keywordText: "",
    });
    expect(secondaryScore).toBeLessThan(primaryScore);
  });

  it("adds a keyword-overlap signal even without a category match", () => {
    const style = makeStyle({ category: "럭셔리" });
    const score = scoreStyle(style, {
      candidateCategoryNames: ["테크"],
      keywordText: "미니멀하고 강렬한 브랜드",
    });
    expect(score).toBeGreaterThan(0);
  });

  it("never exceeds 1", () => {
    const style = makeStyle();
    const score = scoreStyle(style, {
      candidateCategoryNames: ["미니멀", "미니멀"],
      keywordText: "미니멀 여백 강렬한",
    });
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe("buildRecommendationReason", () => {
  it("explains a primary category match", () => {
    const style = makeStyle();
    const reason = buildRecommendationReason(style, {
      candidateCategoryNames: ["미니멀"],
      keywordText: "",
    });
    expect(reason).toContain("1순위");
  });

  it("falls back to a generic reason when nothing matches", () => {
    const style = makeStyle({ category: "럭셔리", keywords: ["고급"] });
    const reason = buildRecommendationReason(style, {
      candidateCategoryNames: ["테크"],
      keywordText: "친근한 카페",
    });
    expect(reason).toContain("럭셔리");
  });
});

describe("buildStyleCandidatesFromAnswers -- 실제 인터뷰 답변 기반 판단 (모던 고정값 제거)", () => {
  it("derives a real category from desiredImpression instead of always falling back to 모던", () => {
    const [primary] = buildStyleCandidatesFromAnswers({
      purpose: "신제품 출시",
      targetAudience: "20대",
      industry: "카페/커피",
      desiredImpression: "고급스럽고 세련된 느낌",
    });
    expect(primary).toBe("럭셔리");
  });

  it("picks two distinct real categories as primary/secondary when both match", () => {
    const [primary, secondary] = buildStyleCandidatesFromAnswers({
      purpose: "창업/오픈",
      targetAudience: "전 연령대",
      industry: "카페/커피",
      desiredImpression: "활기차고 트렌디한 느낌",
    });
    // industry/purpose 텍스트엔 매칭 키워드가 없으므로 desiredImpression 하나만
    // 매칭된다 -- 이 경우 secondary는 기존 안전망 페어를 그대로 쓴다.
    expect(primary).toBe("플레이풀");
    expect(secondary).toBe("모던");
  });

  it("still returns the safety-net pair when truly nothing matches any pattern", () => {
    const [primary, secondary] = buildStyleCandidatesFromAnswers({});
    expect(primary).toBe("모던");
    expect(secondary).toBe("미니멀");
  });
});

describe("categoriesConflict / findConflict", () => {
  it("flags 미니멀 + 플레이풀 as a conflicting combination", () => {
    expect(categoriesConflict("미니멀", "플레이풀")).toBe(true);
    expect(categoriesConflict("플레이풀", "미니멀")).toBe(true);
  });

  it("allows non-conflicting combinations", () => {
    expect(categoriesConflict("미니멀", "모던")).toBe(false);
  });

  it("detects a conflict between the primary and a secondary style", () => {
    const primary = makeStyle({ id: "p", category: "미니멀" });
    const playful = makeStyle({ id: "s1", category: "플레이풀" });
    const conflict = findConflict({ primary, secondaries: [playful] });
    expect(conflict).not.toBeNull();
  });

  it("returns null when there is no conflict", () => {
    const primary = makeStyle({ id: "p", category: "미니멀" });
    const modern = makeStyle({ id: "s1", category: "모던" });
    const conflict = findConflict({ primary, secondaries: [modern] });
    expect(conflict).toBeNull();
  });
});

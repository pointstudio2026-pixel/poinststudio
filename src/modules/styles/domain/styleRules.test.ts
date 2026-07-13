import { describe, expect, it } from "vitest";
import type { Style } from "@/modules/styles/domain/Style";
import {
  buildRecommendationReason,
  categoriesConflict,
  findConflict,
  scoreStyle,
} from "@/modules/styles/domain/styleRules";

function makeStyle(overrides: Partial<Style> = {}): Style {
  return {
    id: "style-1",
    name: "Minimal Bold",
    slug: "minimal-bold",
    level: 3,
    parentId: "parent-1",
    category: "Minimal",
    keywords: ["미니멀", "여백", "강렬한"],
    description: "Minimal 계열의 Bold 스타일입니다.",
    ...overrides,
  };
}

describe("scoreStyle", () => {
  it("scores highest when the style's category matches the primary candidate", () => {
    const style = makeStyle();
    const score = scoreStyle(style, {
      candidateCategoryNames: ["Minimal", "Modern"],
      keywordText: "친근하고 따뜻한 카페",
    });
    expect(score).toBeGreaterThanOrEqual(0.6);
  });

  it("scores lower for a secondary candidate match than a primary match", () => {
    const style = makeStyle();
    const primaryScore = scoreStyle(style, {
      candidateCategoryNames: ["Minimal"],
      keywordText: "",
    });
    const secondaryScore = scoreStyle(style, {
      candidateCategoryNames: ["Modern", "Minimal"],
      keywordText: "",
    });
    expect(secondaryScore).toBeLessThan(primaryScore);
  });

  it("adds a keyword-overlap signal even without a category match", () => {
    const style = makeStyle({ category: "Luxury" });
    const score = scoreStyle(style, {
      candidateCategoryNames: ["Tech"],
      keywordText: "미니멀하고 강렬한 브랜드",
    });
    expect(score).toBeGreaterThan(0);
  });

  it("never exceeds 1", () => {
    const style = makeStyle();
    const score = scoreStyle(style, {
      candidateCategoryNames: ["Minimal", "Minimal"],
      keywordText: "미니멀 여백 강렬한",
    });
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe("buildRecommendationReason", () => {
  it("explains a primary category match", () => {
    const style = makeStyle();
    const reason = buildRecommendationReason(style, {
      candidateCategoryNames: ["Minimal"],
      keywordText: "",
    });
    expect(reason).toContain("1순위");
  });

  it("falls back to a generic reason when nothing matches", () => {
    const style = makeStyle({ category: "Luxury", keywords: ["고급"] });
    const reason = buildRecommendationReason(style, {
      candidateCategoryNames: ["Tech"],
      keywordText: "친근한 카페",
    });
    expect(reason).toContain("Luxury");
  });
});

describe("categoriesConflict / findConflict", () => {
  it("flags Minimal + Playful as a conflicting combination", () => {
    expect(categoriesConflict("minimal", "playful")).toBe(true);
    expect(categoriesConflict("playful", "minimal")).toBe(true);
  });

  it("allows non-conflicting combinations", () => {
    expect(categoriesConflict("minimal", "modern")).toBe(false);
  });

  it("detects a conflict between the primary and a secondary style", () => {
    const primary = makeStyle({ id: "p", category: "Minimal" });
    const playful = makeStyle({ id: "s1", category: "Playful" });
    const conflict = findConflict({ primary, secondaries: [playful] });
    expect(conflict).not.toBeNull();
  });

  it("returns null when there is no conflict", () => {
    const primary = makeStyle({ id: "p", category: "Minimal" });
    const modern = makeStyle({ id: "s1", category: "Modern" });
    const conflict = findConflict({ primary, secondaries: [modern] });
    expect(conflict).toBeNull();
  });
});

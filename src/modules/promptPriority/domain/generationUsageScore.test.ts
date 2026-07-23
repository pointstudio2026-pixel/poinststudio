import { describe, expect, it } from "vitest";
import { computeGenerationUsageScore, REFERENCE_PROMOTION_THRESHOLD } from "@/modules/promptPriority/domain/generationUsageScore";

describe("computeGenerationUsageScore", () => {
  it("uses explicit user feedback as the primary signal when present", () => {
    const score = computeGenerationUsageScore({
      feedback: { likedTags: ["색감이 좋아요", "전체 느낌이 좋아요"], dislikedTags: [] },
      wasRetried: true, // should be ignored -- feedback takes priority
      wasExported: false,
      projectReachedMockupStage: false,
    });
    expect(score).toBe(1);
  });

  it("computes a partial score from mixed liked/disliked feedback", () => {
    const score = computeGenerationUsageScore({
      feedback: { likedTags: ["색감이 좋아요"], dislikedTags: ["너무 복잡해요"] },
      wasRetried: false,
      wasExported: false,
      projectReachedMockupStage: false,
    });
    expect(score).toBe(0.5);
  });

  it("falls back to behavioral signals when no feedback was left", () => {
    const good = computeGenerationUsageScore({
      feedback: null,
      wasRetried: false,
      wasExported: true,
      projectReachedMockupStage: true,
    });
    const bad = computeGenerationUsageScore({
      feedback: null,
      wasRetried: true,
      wasExported: false,
      projectReachedMockupStage: false,
    });
    expect(good).toBeGreaterThan(bad);
  });

  it("clamps the score into [0, 1]", () => {
    const score = computeGenerationUsageScore({
      feedback: null,
      wasRetried: true,
      wasExported: false,
      projectReachedMockupStage: false,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("REFERENCE_PROMOTION_THRESHOLD is 0.8 (사용자 확정: 80점 이상)", () => {
    expect(REFERENCE_PROMOTION_THRESHOLD).toBe(0.8);
  });
});

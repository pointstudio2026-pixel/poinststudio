import { describe, expect, it } from "vitest";
import { computeGenerationUsageScore, REFERENCE_PROMOTION_THRESHOLD } from "@/modules/promptPriority/domain/generationUsageScore";

describe("computeGenerationUsageScore", () => {
  it("returns a neutral score (in the excluded 60~79 band) when no feedback was left", () => {
    const score = computeGenerationUsageScore({ feedback: null });
    expect(score).toBe(0.7);
    expect(score).toBeGreaterThanOrEqual(0.6);
    expect(score).toBeLessThan(0.8);
  });

  it("returns the same neutral score when feedback exists but has no tags", () => {
    const score = computeGenerationUsageScore({ feedback: { likedTags: [], dislikedTags: [] } });
    expect(score).toBe(0.7);
  });

  it("scores a liked-only evaluation into the reference bucket (>=0.8)", () => {
    const score = computeGenerationUsageScore({
      feedback: { likedTags: ["색감이 좋아요", "전체 느낌이 좋아요"], dislikedTags: [] },
    });
    expect(score).toBe(1);
  });

  it("scores a disliked-only evaluation into the avoid bucket (<0.6)", () => {
    const score = computeGenerationUsageScore({
      feedback: { likedTags: [], dislikedTags: ["너무 복잡해요"] },
    });
    expect(score).toBe(0);
  });

  it("computes a partial score from mixed liked/disliked feedback", () => {
    const score = computeGenerationUsageScore({
      feedback: { likedTags: ["색감이 좋아요"], dislikedTags: ["너무 복잡해요"] },
    });
    expect(score).toBe(0.5);
  });

  it("REFERENCE_PROMOTION_THRESHOLD is 0.6 (사용자 확정 2026-07-24: 60점 이상)", () => {
    expect(REFERENCE_PROMOTION_THRESHOLD).toBe(0.6);
  });
});

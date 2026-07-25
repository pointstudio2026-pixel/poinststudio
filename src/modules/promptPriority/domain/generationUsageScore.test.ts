import { describe, expect, it } from "vitest";
import {
  combineUsageAndVisionScore,
  computeGenerationUsageScore,
  REFERENCE_PROMOTION_THRESHOLD,
  USAGE_SCORE_WEIGHT,
  VISION_SCORE_WEIGHT,
} from "@/modules/promptPriority/domain/generationUsageScore";

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

describe("combineUsageAndVisionScore", () => {
  it("weights are 30% usage / 70% vision (사용자 지시 2026-07-25)", () => {
    expect(USAGE_SCORE_WEIGHT).toBe(0.3);
    expect(VISION_SCORE_WEIGHT).toBe(0.7);
    expect(USAGE_SCORE_WEIGHT + VISION_SCORE_WEIGHT).toBe(1);
  });

  it("falls back to the usage score alone when no Vision score exists (legacy rows / failed Vision call)", () => {
    expect(combineUsageAndVisionScore(0.7, null)).toBe(0.7);
    expect(combineUsageAndVisionScore(0, null)).toBe(0);
  });

  it("combines usage and vision at a 30/70 weight when both exist", () => {
    // 0.3*1.0 + 0.7*0.9 = 0.93
    expect(combineUsageAndVisionScore(1, 0.9)).toBe(0.93);
    // 0.3*0 + 0.7*0.2 = 0.14
    expect(combineUsageAndVisionScore(0, 0.2)).toBe(0.14);
    // A neutral (no-feedback) usage score can still be pulled decisively by Vision alone.
    // 0.3*0.7 + 0.7*0.95 = 0.875, which floating-point math resolves just under -> 0.87.
    expect(combineUsageAndVisionScore(0.7, 0.95)).toBe(0.87);
  });

  it("clamps to two decimal places", () => {
    // 0.3*0.33 + 0.7*0.66 = 0.561 -> rounds to 0.56
    expect(combineUsageAndVisionScore(0.33, 0.66)).toBe(0.56);
  });
});

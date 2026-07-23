import { describe, expect, it } from "vitest";
import { evaluateTrainingExamplePromptText } from "@/modules/promptPriority/domain/trainingExampleEvaluation";
import type { TrainingExample } from "@/modules/trainingExamples/domain/TrainingExample";

function makeExample(overrides: Partial<TrainingExample> = {}): TrainingExample {
  return {
    id: "example-1",
    prompt: "카페 브랜드 로고, 미니멀 산세리프, 따뜻한 우드톤",
    deliverableType: "브랜딩 & 로고",
    imageStorageKey: "training-examples/x.png",
    imageContentType: "image/png",
    createdByUserId: "admin-1",
    createdAt: new Date(),
    evaluationScore: null,
    evaluationBreakdown: null,
    evaluatedAt: null,
    source: "ADMIN",
    sourceGenerationVersionId: null,
    category: "이미지생성",
    industry: null,
    ...overrides,
  };
}

describe("evaluateTrainingExamplePromptText", () => {
  it("gives a high score with no flagged terms and no prior examples to compare against", () => {
    const result = evaluateTrainingExamplePromptText("카페 브랜드 로고, 미니멀 산세리프", "브랜딩 & 로고", []);
    expect(result.breakdown.safety.score).toBe(1);
    expect(result.breakdown.originality.score).toBe(1);
    expect(result.score).toBe(1);
  });

  it("penalizes the safety score when the prompt mentions a banned real-brand term", () => {
    const result = evaluateTrainingExamplePromptText("나이키 로고 스타일로 만들어줘", "브랜딩 & 로고", []);
    expect(result.breakdown.safety.score).toBe(0);
    expect(result.breakdown.safety.flaggedTerms.length).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
  });

  it("lowers originality when a near-duplicate example of the same deliverable type already exists", () => {
    const existing = [makeExample({ id: "existing-1", prompt: "카페 브랜드 로고, 미니멀 산세리프, 따뜻한 우드톤" })];
    const result = evaluateTrainingExamplePromptText(
      "카페 브랜드 로고, 미니멀 산세리프, 따뜻한 우드톤",
      "브랜딩 & 로고",
      existing,
    );
    expect(result.breakdown.originality.score).toBeLessThan(1);
  });

  it("does not compare against examples of a different deliverable type", () => {
    const existing = [makeExample({ id: "existing-1", deliverableType: "포스터", prompt: "카페 브랜드 로고, 미니멀 산세리프, 따뜻한 우드톤" })];
    const result = evaluateTrainingExamplePromptText(
      "카페 브랜드 로고, 미니멀 산세리프, 따뜻한 우드톤",
      "브랜딩 & 로고",
      existing,
    );
    expect(result.breakdown.originality.score).toBe(1);
  });

  it("marks brandFit/purposeFit/readability/dbPatternAlignment as not applicable (null), never faking a score", () => {
    const result = evaluateTrainingExamplePromptText("카페 브랜드 로고", "브랜딩 & 로고", []);
    expect(result.breakdown.brandFit.score).toBeNull();
    expect(result.breakdown.purposeFit.score).toBeNull();
    expect(result.breakdown.readability.score).toBeNull();
    expect(result.breakdown.dbPatternAlignment.score).toBeNull();
  });
});

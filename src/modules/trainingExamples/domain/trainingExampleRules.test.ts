import { describe, expect, it } from "vitest";
import { rankTrainingExamples, scoreTrainingExample } from "@/modules/trainingExamples/domain/trainingExampleRules";
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

describe("scoreTrainingExample", () => {
  it("gives 0 when deliverableType doesn't match, regardless of keyword overlap", () => {
    const example = makeExample({ deliverableType: "포스터" });
    const score = scoreTrainingExample(example, { keywordText: "카페 미니멀 우드톤", deliverableType: "브랜딩 & 로고" });
    expect(score).toBe(0);
  });

  it("scores higher when more of the example's prompt words appear in the project's keyword text", () => {
    const example = makeExample();
    const highOverlap = scoreTrainingExample(example, {
      keywordText: "카페 브랜드 로고 미니멀 산세리프 따뜻한 우드톤",
      deliverableType: "브랜딩 & 로고",
    });
    const lowOverlap = scoreTrainingExample(example, {
      keywordText: "병원 클리닉",
      deliverableType: "브랜딩 & 로고",
    });
    expect(highOverlap).toBeGreaterThan(lowOverlap);
    expect(lowOverlap).toBe(0);
  });

  it("gives 0 when both the example and the input specify a different industry", () => {
    const example = makeExample({ industry: "카페/커피" });
    const score = scoreTrainingExample(example, {
      keywordText: "카페 브랜드 로고 미니멀 산세리프 따뜻한 우드톤",
      deliverableType: "브랜딩 & 로고",
      industry: "병원/의원/클리닉",
    });
    expect(score).toBe(0);
  });

  it("does not exclude an example with no industry tag, even when the input specifies one", () => {
    const example = makeExample({ industry: null });
    const score = scoreTrainingExample(example, {
      keywordText: "카페 브랜드 로고 미니멀 산세리프 따뜻한 우드톤",
      deliverableType: "브랜딩 & 로고",
      industry: "카페/커피",
    });
    expect(score).toBeGreaterThan(0);
  });

  it("boosts the score when the example's industry exactly matches the input's", () => {
    // 부분 겹침(1.0 만점이 아닌 값)이어야 가산점 효과가 실제로 관찰된다 --
    // 겹침이 이미 100%면 clamp(min 1)에 가려서 차이가 안 보인다.
    const example = makeExample({ industry: "카페/커피" });
    const withMatch = scoreTrainingExample(example, {
      keywordText: "카페 브랜드 로고",
      deliverableType: "브랜딩 & 로고",
      industry: "카페/커피",
    });
    const withoutIndustryInput = scoreTrainingExample(example, {
      keywordText: "카페 브랜드 로고",
      deliverableType: "브랜딩 & 로고",
    });
    expect(withMatch).toBeGreaterThan(withoutIndustryInput);
  });
});

describe("rankTrainingExamples", () => {
  it("sorts by score descending", () => {
    const strong = makeExample({ id: "strong", prompt: "카페 미니멀 로고" });
    const weak = makeExample({ id: "weak", prompt: "병원 클리닉 로고" });

    const ranked = rankTrainingExamples([weak, strong], {
      keywordText: "카페 미니멀",
      deliverableType: "브랜딩 & 로고",
    });

    expect(ranked[0]?.example.id).toBe("strong");
    expect(ranked[0]!.score).toBeGreaterThan(ranked[1]!.score);
  });
});

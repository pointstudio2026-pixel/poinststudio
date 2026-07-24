import { describe, expect, it } from "vitest";
import {
  buildVisionEvaluationPrompt,
  computeVisionScore,
  parseVisionEvaluationResponse,
  summarizeBrandContext,
  summarizeHardConstraints,
  type VisionEvaluationResult,
} from "@/modules/generations/domain/visionEvaluation";
import type { HardConstraintSet } from "@/modules/promptPriority/domain/HardConstraint";

const EMPTY_HARD_CONSTRAINTS: HardConstraintSet = {
  exactBrandName: "",
  forbiddenColors: [],
  requiredColors: [],
  forbiddenStyleNames: [],
  forbiddenLogoCategoryNames: [],
  forbiddenElements: [],
  requiredElements: [],
  purpose: [],
  freeTextConstraints: "",
};

const GOOD_RESULT: VisionEvaluationResult = {
  hardConstraintsRespected: true,
  brandAlignment: { score: 0.9, reasoning: "잘 어울림" },
  trendAlignment: { score: 0.8, reasoning: "트렌디함" },
  technicalQuality: { score: 1, reasoning: "결함 없음" },
  singleConceptRespected: true,
  summary: "훌륭한 결과",
};

describe("buildVisionEvaluationPrompt", () => {
  it("includes the prompt text, brand context, and constraint context when constraints exist", () => {
    const { systemPrompt, userPrompt } = buildVisionEvaluationPrompt({
      imagePromptText: "미니멀 로고를 그려주세요",
      brandContext: "브랜드명 \"Aster Bakery\", 업종: 베이커리",
      constraintContext: "금지 색상: #FFD700",
    });

    expect(systemPrompt).toContain("JSON");
    expect(userPrompt).toContain("미니멀 로고를 그려주세요");
    expect(userPrompt).toContain("Aster Bakery");
    expect(userPrompt).toContain("금지 색상: #FFD700");
  });

  it("omits the constraint line entirely when there are no hard constraints", () => {
    const { userPrompt } = buildVisionEvaluationPrompt({
      imagePromptText: "prompt",
      brandContext: "브랜드 인터뷰 정보 없음",
      constraintContext: "",
    });

    expect(userPrompt).not.toContain("필수 조건:");
  });
});

describe("parseVisionEvaluationResponse", () => {
  it("parses a well-formed JSON response", () => {
    const text = JSON.stringify(GOOD_RESULT);
    expect(parseVisionEvaluationResponse(text)).toEqual(GOOD_RESULT);
  });

  it("extracts JSON even when wrapped in a markdown code fence with extra prose", () => {
    const text = `물론이죠, 평가 결과입니다:\n\`\`\`json\n${JSON.stringify(GOOD_RESULT)}\n\`\`\`\n감사합니다.`;
    expect(parseVisionEvaluationResponse(text)).toEqual(GOOD_RESULT);
  });

  it("clamps out-of-range scores into [0, 1]", () => {
    const text = JSON.stringify({
      ...GOOD_RESULT,
      brandAlignment: { score: 1.5, reasoning: "x" },
      trendAlignment: { score: -0.5, reasoning: "x" },
    });
    const parsed = parseVisionEvaluationResponse(text);
    expect(parsed.brandAlignment.score).toBe(1);
    expect(parsed.trendAlignment.score).toBe(0);
  });

  it("throws when no JSON object can be found", () => {
    expect(() => parseVisionEvaluationResponse("죄송하지만 평가할 수 없습니다.")).toThrow();
  });
});

describe("computeVisionScore", () => {
  it("weights brandAlignment highest (0.4), then trend/technical (0.3 each)", () => {
    const score = computeVisionScore(GOOD_RESULT);
    expect(score).toBeCloseTo(0.9 * 0.4 + 0.8 * 0.3 + 1 * 0.3, 2);
  });

  it("caps the score at 0.2 when hard constraints were violated, regardless of other scores", () => {
    const score = computeVisionScore({ ...GOOD_RESULT, hardConstraintsRespected: false });
    expect(score).toBeLessThanOrEqual(0.2);
  });

  it("caps the score at 0.3 when multiple concepts were mixed into one image", () => {
    const score = computeVisionScore({ ...GOOD_RESULT, singleConceptRespected: false });
    expect(score).toBeLessThanOrEqual(0.3);
  });
});

describe("summarizeBrandContext", () => {
  it("summarizes the key interview answers into one Korean sentence", () => {
    const summary = summarizeBrandContext([
      { questionKey: "brandName", questionText: "", answer: "Aster Bakery", sequence: 1 },
      { questionKey: "industry", questionText: "", answer: "베이커리", sequence: 2 },
    ]);
    expect(summary).toContain("Aster Bakery");
    expect(summary).toContain("베이커리");
  });

  it("falls back to a placeholder when no answers exist", () => {
    expect(summarizeBrandContext([])).toBe("브랜드 인터뷰 정보 없음");
  });
});

describe("summarizeHardConstraints", () => {
  it("returns an empty string when there are no constraints", () => {
    expect(summarizeHardConstraints(EMPTY_HARD_CONSTRAINTS)).toBe("");
    expect(summarizeHardConstraints(null)).toBe("");
  });

  it("lists forbidden colors and elements when present", () => {
    const summary = summarizeHardConstraints({
      ...EMPTY_HARD_CONSTRAINTS,
      forbiddenColors: ["#FFD700"],
      forbiddenElements: ["동물"],
    });
    expect(summary).toContain("#FFD700");
    expect(summary).toContain("동물");
  });
});

import { describe, expect, it } from "vitest";
import { EvaluateGenerationVisionUseCase } from "@/modules/generations/application/EvaluateGenerationVisionUseCase";
import { FakeGenerationEvaluationRepository } from "@/modules/generations/testing/fakes";
import { FakePromptDecisionRecordRepository } from "@/modules/promptPriority/testing/fakes";
import { FakeInterviewRepository } from "@/modules/interviews/testing/fakes";
import type { TextCompletionProvider, TextCompletionRequest, TextCompletionResult } from "@/shared/ai/TextCompletionProvider";
import type { HardConstraintSet, SoftPreferenceSet } from "@/modules/promptPriority/domain/HardConstraint";

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
const EMPTY_SOFT_PREFERENCES: SoftPreferenceSet = { moodWords: [] };

class StubVisionProvider implements TextCompletionProvider {
  readonly name = "stub";
  constructor(
    private readonly responder: (request: TextCompletionRequest) => TextCompletionResult | Promise<TextCompletionResult>,
  ) {}
  async complete(request: TextCompletionRequest): Promise<TextCompletionResult> {
    return this.responder(request);
  }
  async health(): Promise<boolean> {
    return true;
  }
}

function setup(provider: TextCompletionProvider) {
  const generationEvaluations = new FakeGenerationEvaluationRepository();
  const decisionRecords = new FakePromptDecisionRecordRepository();
  const interviews = new FakeInterviewRepository();
  const useCase = new EvaluateGenerationVisionUseCase(generationEvaluations, decisionRecords, interviews, provider);
  return { useCase, generationEvaluations, decisionRecords, interviews };
}

describe("EvaluateGenerationVisionUseCase", () => {
  it("passes the image and prompt to the provider, parses the JSON response, and stores a combined score", async () => {
    const provider = new StubVisionProvider((request) => {
      expect(request.imageDataUris).toEqual(["https://example.com/generated.png"]);
      expect(request.userPrompt).toContain("미니멀 로고");
      return {
        text: JSON.stringify({
          hardConstraintsRespected: true,
          brandAlignment: { score: 0.9, reasoning: "ok" },
          trendAlignment: { score: 0.8, reasoning: "ok" },
          technicalQuality: { score: 1, reasoning: "ok" },
          singleConceptRespected: true,
          summary: "좋은 결과",
        }),
        provider: "stub",
        model: "stub-v1",
      };
    });
    const ctx = setup(provider);
    const evaluation = await ctx.generationEvaluations.create({
      generationVersionId: "gv-1",
      status: "PROMPT_LEVEL_ONLY",
      hardConstraintPassed: true,
      issues: [],
    });
    await ctx.decisionRecords.create({
      promptVersionId: "pv-1",
      hardConstraints: EMPTY_HARD_CONSTRAINTS,
      softPreferences: EMPTY_SOFT_PREFERENCES,
      dbCandidatesFound: [],
      dbCandidatesUsed: [],
      conflicts: [],
      complianceCheck: { passed: true, issues: [] },
    });

    await ctx.useCase.execute({
      generationEvaluationId: evaluation.id,
      projectId: "project-1",
      promptVersionId: "pv-1",
      imageUrl: "https://example.com/generated.png",
      imagePromptText: "미니멀 로고를 그려주세요",
    });

    const updated = await ctx.generationEvaluations.findByGenerationVersionId("gv-1");
    expect(updated?.status).toBe("VISION_VERIFIED");
    expect(updated?.visionScore).toBeCloseTo(0.9 * 0.4 + 0.8 * 0.3 + 1 * 0.3, 2);
    expect(updated?.visionEvaluation?.summary).toBe("좋은 결과");
  });

  it("swallows provider errors and leaves the evaluation untouched (best-effort, never blocks generation)", async () => {
    const provider = new StubVisionProvider(() => {
      throw new Error("network down");
    });
    const ctx = setup(provider);
    const evaluation = await ctx.generationEvaluations.create({
      generationVersionId: "gv-2",
      status: "PROMPT_LEVEL_ONLY",
      hardConstraintPassed: true,
      issues: [],
    });

    await expect(
      ctx.useCase.execute({
        generationEvaluationId: evaluation.id,
        projectId: "project-1",
        promptVersionId: "pv-none",
        imageUrl: "https://example.com/generated.png",
        imagePromptText: "prompt",
      }),
    ).resolves.toBeUndefined();

    const untouched = await ctx.generationEvaluations.findByGenerationVersionId("gv-2");
    expect(untouched?.status).toBe("PROMPT_LEVEL_ONLY");
    expect(untouched?.visionScore).toBeNull();
  });

  it("swallows unparseable responses the same way (best-effort)", async () => {
    const provider = new StubVisionProvider(() => ({
      text: "죄송하지만 이미지를 분석할 수 없습니다.",
      provider: "stub",
      model: "stub-v1",
    }));
    const ctx = setup(provider);
    const evaluation = await ctx.generationEvaluations.create({
      generationVersionId: "gv-3",
      status: "PROMPT_LEVEL_ONLY",
      hardConstraintPassed: true,
      issues: [],
    });

    await ctx.useCase.execute({
      generationEvaluationId: evaluation.id,
      projectId: "project-1",
      promptVersionId: "pv-none",
      imageUrl: "https://example.com/generated.png",
      imagePromptText: "prompt",
    });

    const untouched = await ctx.generationEvaluations.findByGenerationVersionId("gv-3");
    expect(untouched?.status).toBe("PROMPT_LEVEL_ONLY");
  });
});

import { describe, expect, it } from "vitest";
import { PromoteGenerationsToReferenceUseCase } from "@/modules/promptPriority/application/PromoteGenerationsToReferenceUseCase";
import {
  FakeGenerationEvaluationRepository,
  FakeGenerationFeedbackRepository,
  FakeGenerationRepository,
} from "@/modules/generations/testing/fakes";
import { FakeExportRepository } from "@/modules/exports/testing/fakes";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { FakeInterviewRepository } from "@/modules/interviews/testing/fakes";
import { FakePromptRepository } from "@/modules/prompts/testing/fakes";
import { FakePromptDecisionRecordRepository } from "@/modules/promptPriority/testing/fakes";
import { FakeTrainingExampleRepository } from "@/modules/trainingExamples/testing/fakes";
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

function setup() {
  const generationEvaluations = new FakeGenerationEvaluationRepository();
  const generations = new FakeGenerationRepository();
  const feedback = new FakeGenerationFeedbackRepository();
  const exports = new FakeExportRepository();
  const projects = new FakeProjectRepository();
  const interviews = new FakeInterviewRepository();
  const prompts = new FakePromptRepository();
  const decisionRecords = new FakePromptDecisionRecordRepository();
  const trainingExamples = new FakeTrainingExampleRepository();

  const useCase = new PromoteGenerationsToReferenceUseCase(
    generationEvaluations,
    generations,
    feedback,
    exports,
    projects,
    interviews,
    prompts,
    decisionRecords,
    trainingExamples,
  );

  return { useCase, generationEvaluations, generations, feedback, exports, projects, interviews, prompts, decisionRecords, trainingExamples };
}

describe("PromoteGenerationsToReferenceUseCase", () => {
  it("backfills a GenerationEvaluation for a completed version whose evaluation row was never created (e.g. a deploy restart interrupted the original write), then evaluates it normally", async () => {
    const ctx = setup();
    const created = await new CreateProjectUseCase(ctx.projects).execute({ userId: "user-1", name: "Test" });
    const prompt = await ctx.prompts.createWithFirstVersion(created.projectId, {
      provider: "openai",
      systemPrompt: "system",
      userPrompt: "user prompt text",
      hash: "hash-1",
      payload: {
        provider: "openai",
        model: "gpt-image-2",
        systemPrompt: "system",
        userPrompt: "user prompt text",
        sizePreset: "square",
        parameters: {},
      },
      flaggedTerms: [],
    });
    const promptVersionId = prompt.currentVersion.id;
    const generation = await ctx.generations.createWithFirstVersion(created.projectId, { promptVersionId });
    await ctx.generations.updateVersionResult(generation.currentVersion.id, {
      status: "completed",
      images: [{ url: "data:image/png;base64,AAA", thumbnailUrl: "t" }],
      completedAt: new Date(),
    });
    // No GenerationEvaluation row exists yet -- simulates the deploy-restart gap.
    expect(ctx.generationEvaluations.evaluations).toHaveLength(0);

    await ctx.decisionRecords.create({
      promptVersionId,
      hardConstraints: EMPTY_HARD_CONSTRAINTS,
      softPreferences: EMPTY_SOFT_PREFERENCES,
      dbCandidatesFound: [],
      dbCandidatesUsed: [],
      conflicts: [],
      complianceCheck: { passed: true, issues: [] },
    });

    const result = await ctx.useCase.execute();

    expect(ctx.generationEvaluations.evaluations).toHaveLength(1);
    expect(ctx.generationEvaluations.evaluations[0]?.generationVersionId).toBe(generation.currentVersion.id);
    expect(result.evaluated).toBe(1);
  });

  it("does not backfill when no PromptDecisionRecord exists for that prompt version (project has no hard constraints)", async () => {
    const ctx = setup();
    const created = await new CreateProjectUseCase(ctx.projects).execute({ userId: "user-1", name: "Test" });
    const generation = await ctx.generations.createWithFirstVersion(created.projectId, { promptVersionId: "prompt-version-none" });
    await ctx.generations.updateVersionResult(generation.currentVersion.id, {
      status: "completed",
      images: [{ url: "data:image/png;base64,AAA", thumbnailUrl: "t" }],
      completedAt: new Date(),
    });

    const result = await ctx.useCase.execute();

    expect(ctx.generationEvaluations.evaluations).toHaveLength(0);
    expect(result.evaluated).toBe(0);
  });

  it("skips versions already marked as evaluated (evaluatedVersionIds), leaving their real evaluation row untouched", async () => {
    const ctx = setup();
    const created = await new CreateProjectUseCase(ctx.projects).execute({ userId: "user-1", name: "Test" });
    const generation = await ctx.generations.createWithFirstVersion(created.projectId, { promptVersionId: "prompt-version-2" });
    await ctx.generations.updateVersionResult(generation.currentVersion.id, {
      status: "completed",
      images: [{ url: "data:image/png;base64,AAA", thumbnailUrl: "t" }],
      completedAt: new Date(),
    });
    const existing = await ctx.generationEvaluations.create({
      generationVersionId: generation.currentVersion.id,
      status: "PROMPT_LEVEL_ONLY",
      hardConstraintPassed: true,
      issues: [],
    });
    ctx.generations.evaluatedVersionIds.add(generation.currentVersion.id);

    await ctx.useCase.execute();

    expect(ctx.generationEvaluations.evaluations).toHaveLength(1);
    expect(ctx.generationEvaluations.evaluations[0]?.id).toBe(existing.id);
  });
});

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

  it("(회피 저장) stores a below-threshold (avoid-bucket) generation as a TrainingExample, with a dynamic note describing the real signals -- no image, prompt only", async () => {
    const ctx = setup();
    const created = await new CreateProjectUseCase(ctx.projects).execute({ userId: "user-1", name: "Test" });
    const prompt = await ctx.prompts.createWithFirstVersion(created.projectId, {
      provider: "openai",
      systemPrompt: "system",
      userPrompt: "a below-threshold prompt",
      hash: "hash-2",
      payload: {
        provider: "openai",
        model: "gpt-image-2",
        systemPrompt: "system",
        userPrompt: "a below-threshold prompt",
        sizePreset: "square",
        parameters: {},
      },
      flaggedTerms: [],
    });
    const generation = await ctx.generations.createWithFirstVersion(created.projectId, { promptVersionId: prompt.currentVersion.id });
    await ctx.generations.updateVersionResult(generation.currentVersion.id, {
      status: "completed",
      images: [{ url: "data:image/png;base64,AAA", thumbnailUrl: "t" }],
      completedAt: new Date(),
    });
    await ctx.decisionRecords.create({
      promptVersionId: prompt.currentVersion.id,
      hardConstraints: EMPTY_HARD_CONSTRAINTS,
      softPreferences: EMPTY_SOFT_PREFERENCES,
      dbCandidatesFound: [],
      dbCandidatesUsed: [],
      conflicts: [],
      complianceCheck: { passed: true, issues: [] },
    });
    // No feedback, no retry, no export, no mockup progress -- baseline 0.5, below the 0.6 threshold.

    const result = await ctx.useCase.execute();

    expect(result.promoted).toBe(1);
    expect(ctx.trainingExamples.examples).toHaveLength(1);
    const stored = ctx.trainingExamples.examples[0]!;
    expect(stored.evaluationScore).toBe(0.5);
    expect(stored.imageStorageKey).toBeNull();
    expect(stored.imageContentType).toBeNull();
    expect(stored.evaluationBreakdown?.usageScore?.note).toContain("재시도 없이 그대로 사용됨");
    expect(stored.evaluationBreakdown?.usageScore?.note).toContain("아직 내보내지 않음");
    expect(stored.evaluationBreakdown?.usageScore?.note).toContain("목업 단계 전");
  });

  it("(Vision 결합) averages a pre-existing Vision score with the behavioral score, and surfaces the Vision summary as its own breakdown entry", async () => {
    const ctx = setup();
    const created = await new CreateProjectUseCase(ctx.projects).execute({ userId: "user-1", name: "Test" });
    const prompt = await ctx.prompts.createWithFirstVersion(created.projectId, {
      provider: "openai",
      systemPrompt: "system",
      userPrompt: "a vision-scored prompt",
      hash: "hash-3",
      payload: {
        provider: "openai",
        model: "gpt-image-2",
        systemPrompt: "system",
        userPrompt: "a vision-scored prompt",
        sizePreset: "square",
        parameters: {},
      },
      flaggedTerms: [],
    });
    const generation = await ctx.generations.createWithFirstVersion(created.projectId, { promptVersionId: prompt.currentVersion.id });
    await ctx.generations.updateVersionResult(generation.currentVersion.id, {
      status: "completed",
      images: [{ url: "data:image/png;base64,AAA", thumbnailUrl: "t" }],
      completedAt: new Date(),
    });
    await ctx.decisionRecords.create({
      promptVersionId: prompt.currentVersion.id,
      hardConstraints: EMPTY_HARD_CONSTRAINTS,
      softPreferences: EMPTY_SOFT_PREFERENCES,
      dbCandidatesFound: [],
      dbCandidatesUsed: [],
      conflicts: [],
      complianceCheck: { passed: true, issues: [] },
    });
    // 생성 직후 Vision AI가 이미 채워놓은 상태를 흉내낸다 (실제 타임라인:
    // Vision은 생성 시점에, usageScore는 이 유스케이스 실행 시점에 채워짐).
    const preEvaluation = await ctx.generationEvaluations.create({
      generationVersionId: generation.currentVersion.id,
      status: "PROMPT_LEVEL_ONLY",
      hardConstraintPassed: true,
      issues: [],
    });
    await ctx.generationEvaluations.updateVisionEvaluation(preEvaluation.id, 0.9, {
      hardConstraintsRespected: true,
      brandAlignment: { score: 0.9, reasoning: "ok" },
      trendAlignment: { score: 0.9, reasoning: "ok" },
      technicalQuality: { score: 0.9, reasoning: "ok" },
      singleConceptRespected: true,
      summary: "Vision: 매우 훌륭함",
    });
    // 참고(80점 이상) 버킷에 실제로 들어가는 걸 보여주려면 behavioral도
    // 끌어올려야 한다(behavioral 0.5 + vision 0.9의 평균은 0.7로 60~79점
    // 제외 구간에 걸려 저장되지 않는다) -- 실제 내보내기 신호(+0.3)로
    // behavioral을 0.8까지 올린다.
    const exportJob = await ctx.exports.create({
      projectId: created.projectId,
      source: "generation",
      format: "png",
      sourceRefId: generation.currentVersion.id,
      sections: [],
      includeBrandInfo: false,
      watermarked: false,
    });
    await ctx.exports.updateResult(exportJob.id, { status: "completed", completedAt: new Date() });

    await ctx.useCase.execute();

    const stored = ctx.trainingExamples.examples[0]!;
    // behavioral(재시도 없음/내보냄/목업 전) = 0.5+0.3 = 0.8, vision = 0.9 -> 평균 0.85.
    expect(stored.evaluationScore).toBe(0.85);
    expect(stored.evaluationBreakdown?.usageScore?.score).toBe(0.8);
    expect(stored.evaluationBreakdown?.visionQuality?.score).toBe(0.9);
    expect(stored.evaluationBreakdown?.visionQuality?.note).toBe("Vision: 매우 훌륭함");
  });

  it("(60~79점 제외) evaluates but does not store a mid-band generation -- ambiguous signal, not clearly good or bad", async () => {
    const ctx = setup();
    const created = await new CreateProjectUseCase(ctx.projects).execute({ userId: "user-1", name: "Test" });
    const prompt = await ctx.prompts.createWithFirstVersion(created.projectId, {
      provider: "openai",
      systemPrompt: "system",
      userPrompt: "a mid-band prompt",
      hash: "hash-4",
      payload: {
        provider: "openai",
        model: "gpt-image-2",
        systemPrompt: "system",
        userPrompt: "a mid-band prompt",
        sizePreset: "square",
        parameters: {},
      },
      flaggedTerms: [],
    });
    const generation = await ctx.generations.createWithFirstVersion(created.projectId, { promptVersionId: prompt.currentVersion.id });
    await ctx.generations.updateVersionResult(generation.currentVersion.id, {
      status: "completed",
      images: [{ url: "data:image/png;base64,AAA", thumbnailUrl: "t" }],
      completedAt: new Date(),
    });
    await ctx.decisionRecords.create({
      promptVersionId: prompt.currentVersion.id,
      hardConstraints: EMPTY_HARD_CONSTRAINTS,
      softPreferences: EMPTY_SOFT_PREFERENCES,
      dbCandidatesFound: [],
      dbCandidatesUsed: [],
      conflicts: [],
      complianceCheck: { passed: true, issues: [] },
    });
    // 재시도 없음/미내보냄이지만 목업 단계까지는 진행함: 0.5 + 0.2 = 0.7 (60~79점 구간).
    const project = await ctx.projects.findById(created.projectId);
    await ctx.projects.save({ ...project!, currentStep: "mockup" });

    const result = await ctx.useCase.execute();

    expect(result.evaluated).toBe(1);
    expect(result.promoted).toBe(0);
    expect(ctx.trainingExamples.examples).toHaveLength(0);
    const evaluation = ctx.generationEvaluations.evaluations.find(
      (e) => e.generationVersionId === generation.currentVersion.id,
    );
    expect(evaluation?.usageScore).toBe(0.7);
    expect(evaluation?.promotedToReference).toBe(false);
  });
});

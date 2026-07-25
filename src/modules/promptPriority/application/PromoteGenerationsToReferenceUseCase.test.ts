import { describe, expect, it } from "vitest";
import { PromoteGenerationsToReferenceUseCase } from "@/modules/promptPriority/application/PromoteGenerationsToReferenceUseCase";
import {
  FakeGenerationEvaluationRepository,
  FakeGenerationFeedbackRepository,
  FakeGenerationRepository,
} from "@/modules/generations/testing/fakes";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { FakeInterviewRepository } from "@/modules/interviews/testing/fakes";
import { FakePromptRepository } from "@/modules/prompts/testing/fakes";
import { FakePromptDecisionRecordRepository } from "@/modules/promptPriority/testing/fakes";
import { FakeTrainingExampleRepository } from "@/modules/trainingExamples/testing/fakes";
import { FakeUserRepository } from "@/modules/auth/testing/fakes";
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
  const projects = new FakeProjectRepository();
  const interviews = new FakeInterviewRepository();
  const prompts = new FakePromptRepository();
  const decisionRecords = new FakePromptDecisionRecordRepository();
  const trainingExamples = new FakeTrainingExampleRepository();
  const users = new FakeUserRepository();

  const useCase = new PromoteGenerationsToReferenceUseCase(
    generationEvaluations,
    generations,
    feedback,
    projects,
    interviews,
    prompts,
    decisionRecords,
    trainingExamples,
    users,
  );

  return { useCase, generationEvaluations, generations, feedback, projects, interviews, prompts, decisionRecords, trainingExamples, users };
}

async function createCompletedGeneration(
  ctx: ReturnType<typeof setup>,
  userPrompt: string,
  hash: string,
) {
  const created = await new CreateProjectUseCase(ctx.projects).execute({ userId: "user-1", name: "Test" });
  const prompt = await ctx.prompts.createWithFirstVersion(created.projectId, {
    provider: "openai",
    systemPrompt: "system",
    userPrompt,
    hash,
    payload: {
      provider: "openai",
      model: "gpt-image-2",
      systemPrompt: "system",
      userPrompt,
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
  return { projectId: created.projectId, generation, promptVersionId: prompt.currentVersion.id };
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

  it("(회피 저장) stores a disliked-feedback generation as a TrainingExample (avoid bucket), with a note describing what the user disliked", async () => {
    const ctx = setup();
    const { generation } = await createCompletedGeneration(ctx, "a below-threshold prompt", "hash-2");
    await ctx.feedback.upsert({
      generationVersionId: generation.currentVersion.id,
      likedTags: [],
      dislikedTags: ["너무 복잡해요"],
      freeText: null,
    });

    const result = await ctx.useCase.execute();

    expect(result.promoted).toBe(1);
    expect(ctx.trainingExamples.examples).toHaveLength(1);
    const stored = ctx.trainingExamples.examples[0]!;
    expect(stored.evaluationScore).toBe(0);
    expect(stored.imageStorageKey).toBeNull();
    expect(stored.imageContentType).toBeNull();
    expect(stored.evaluationBreakdown?.usageScore?.note).toContain("사용자가 아쉬운 점으로 선택: 너무 복잡해요");
  });

  it("(평가 없음 -> 미저장) a completed generation with no user feedback gets a neutral score and is never stored, regardless of retry/export/project progress", async () => {
    const ctx = setup();
    const { generation } = await createCompletedGeneration(ctx, "an unrated prompt", "hash-3");

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

  it("(Vision 결합) combines a pre-existing Vision score with the feedback-based score at a 30/70 weight, and surfaces the Vision summary as its own breakdown entry", async () => {
    const ctx = setup();
    const { generation } = await createCompletedGeneration(ctx, "a vision-scored prompt", "hash-4");
    await ctx.feedback.upsert({
      generationVersionId: generation.currentVersion.id,
      likedTags: ["색감이 좋아요", "전체 느낌이 좋아요"],
      dislikedTags: [],
      freeText: null,
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
    // 이미 평가가 있다고 표시해둬야 자가 치유 로직이 중복 평가 행을 만들지 않는다.
    ctx.generations.evaluatedVersionIds.add(generation.currentVersion.id);

    await ctx.useCase.execute();

    expect(ctx.trainingExamples.examples).toHaveLength(1);
    const stored = ctx.trainingExamples.examples[0]!;
    // feedback(전부 좋아요) = 1.0, vision = 0.9 -> 0.3*1.0 + 0.7*0.9 = 0.93.
    expect(stored.evaluationScore).toBe(0.93);
    expect(stored.evaluationBreakdown?.usageScore?.score).toBe(1);
    expect(stored.evaluationBreakdown?.visionQuality?.score).toBe(0.9);
    expect(stored.evaluationBreakdown?.visionQuality?.note).toBe("Vision: 매우 훌륭함");
  });

  it("(관리자 계정 -> Vision 100%) ignores the feedback-based score entirely for a project owned by an admin account, using only the Vision score -- can even flip the stored/not-stored outcome vs. the 30/70 real-user formula", async () => {
    const ctx = setup();
    const { generation, projectId } = await createCompletedGeneration(ctx, "an admin test prompt", "hash-6");
    const project = await ctx.projects.findById(projectId);
    ctx.users.users.push({
      id: project!.userId,
      email: "admin@aster.dev",
      passwordHash: null,
      name: "Admin",
      birthDate: null,
      role: "admin",
      adminTier: "super_admin",
      emailVerifiedAt: new Date(),
      lastLoginAt: null,
      suspendedAt: null,
      deletedAt: null,
      createdAt: new Date(),
      emailVerificationToken: null,
      emailVerificationTokenExpiresAt: null,
    });
    // 아쉬운 점만 남겼더라도(behavioral = 0) 관리자 계정 소유 생성물이면
    // 완전히 무시된다 -- 30/70 공식이었다면 0.3*0+0.7*0.9=0.63으로 애매한
    // 구간에 걸려 저장조차 안 됐을 값이, Vision 100%에서는 0.9로 참고
    // 자료로 승격된다(관리자 계정은 아예 다른 정책이 적용됨을 증명).
    await ctx.feedback.upsert({
      generationVersionId: generation.currentVersion.id,
      likedTags: [],
      dislikedTags: ["전체적으로 별로예요"],
      freeText: null,
    });
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
    // 이미 평가가 있다고 표시해둬야 자가 치유 로직이 중복 평가 행을 만들지 않는다.
    ctx.generations.evaluatedVersionIds.add(generation.currentVersion.id);

    await ctx.useCase.execute();

    expect(ctx.trainingExamples.examples).toHaveLength(1);
    const stored = ctx.trainingExamples.examples[0]!;
    expect(stored.evaluationScore).toBe(0.9);
    expect(stored.evaluationBreakdown?.usageScore?.score).toBe(0);
    expect(stored.evaluationBreakdown?.visionQuality?.score).toBe(0.9);
  });

  it("(60~79점 제외) evaluates but does not store a mixed liked/disliked generation that lands in the mid-band -- ambiguous signal, not clearly good or bad", async () => {
    const ctx = setup();
    const { generation } = await createCompletedGeneration(ctx, "a mid-band prompt", "hash-5");
    await ctx.feedback.upsert({
      generationVersionId: generation.currentVersion.id,
      likedTags: ["색감이 좋아요", "전체 느낌이 좋아요"],
      dislikedTags: ["너무 복잡해요"],
      freeText: null,
    });
    // liked=2, disliked=1 -> 2/3 = 0.67 (60~79점 구간).

    const result = await ctx.useCase.execute();

    expect(result.evaluated).toBe(1);
    expect(result.promoted).toBe(0);
    expect(ctx.trainingExamples.examples).toHaveLength(0);
    const evaluation = ctx.generationEvaluations.evaluations.find(
      (e) => e.generationVersionId === generation.currentVersion.id,
    );
    expect(evaluation?.usageScore).toBe(0.67);
    expect(evaluation?.promotedToReference).toBe(false);
  });
});

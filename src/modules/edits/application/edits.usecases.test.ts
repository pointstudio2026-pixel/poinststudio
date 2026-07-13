import { describe, expect, it, vi } from "vitest";
import { CreateEditUseCase } from "@/modules/edits/application/CreateEditUseCase";
import { RetryEditUseCase } from "@/modules/edits/application/RetryEditUseCase";
import { GetEditHistoryUseCase } from "@/modules/edits/application/GetEditHistoryUseCase";
import { ProcessEditJobUseCase } from "@/modules/edits/application/ProcessEditJobUseCase";
import { FakeEditHistoryRepository, FakeImageEditQueue } from "@/modules/edits/testing/fakes";
import { FakeGenerationRepository } from "@/modules/generations/testing/fakes";
import { FakePromptRepository } from "@/modules/prompts/testing/fakes";
import type { PromptVersionInput } from "@/modules/prompts/domain/PromptRepository";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { CheckPlanUseCase } from "@/modules/subscriptions/application/CheckPlanUseCase";
import { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import { FakeSubscriptionRepository, FakeUsageRepository } from "@/modules/subscriptions/testing/fakes";
import { GENERATION_EVENT_TYPE, PLAN_LIMITS } from "@/modules/subscriptions/domain/planLimits";
import { MockImageGenerationProvider, FORCE_FAILURE_MARKER } from "@/shared/ai/MockImageGenerationProvider";
import { ConflictError, NotFoundError, UsageLimitError, ValidationError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

const PROMPT_INPUT: PromptVersionInput = {
  provider: "openai",
  systemPrompt: "system",
  userPrompt: "brand user prompt",
  hash: "hash-1",
  payload: { provider: "openai", model: "gpt-image-1", systemPrompt: "system", userPrompt: "brand user prompt", parameters: {} },
  flaggedTerms: [],
};

async function setup() {
  const projects = new FakeProjectRepository();
  const prompts = new FakePromptRepository();
  const generations = new FakeGenerationRepository();
  const edits = new FakeEditHistoryRepository();
  const queue = new FakeImageEditQueue();
  const subs = new FakeSubscriptionRepository();
  const usage = new FakeUsageRepository();
  const checkPlan = new CheckPlanUseCase(subs, usage);
  const recordUsage = new RecordUsageUseCase(usage);
  const provider = new MockImageGenerationProvider();

  const { projectId } = await new CreateProjectUseCase(projects).execute({ userId: "user-1", name: "Bakery" });
  const prompt = await prompts.createWithFirstVersion(projectId, PROMPT_INPUT);
  const generation = await generations.createWithFirstVersion(projectId, { promptVersionId: prompt.currentVersion.id });
  await generations.updateVersionResult(generation.currentVersion.id, {
    status: "completed",
    provider: "mock",
    images: [
      { url: "data:image/svg+xml;base64,AAA", thumbnailUrl: "data:image/svg+xml;base64,aaa" },
      { url: "data:image/svg+xml;base64,BBB", thumbnailUrl: "data:image/svg+xml;base64,bbb" },
    ],
    costAmount: 0,
    completedAt: new Date(),
  });
  const sourceVersion = await generations.getVersionById(generation.currentVersion.id);

  return {
    projectId,
    generationId: generation.id,
    sourceVersion: sourceVersion!,
    projects,
    prompts,
    generations,
    edits,
    queue,
    subs,
    usage,
    create: new CreateEditUseCase(projects, generations, checkPlan, edits, queue),
    retry: new RetryEditUseCase(projects, generations, checkPlan, edits, queue),
    getHistory: new GetEditHistoryUseCase(projects, generations, edits),
    process: new ProcessEditJobUseCase(projects, prompts, generations, edits, recordUsage, provider),
  };
}

describe("CreateEditUseCase", () => {
  it("rejects an unknown preset key", async () => {
    const ctx = await setup();
    await expect(
      ctx.create.execute({
        projectId: ctx.projectId,
        userId: "user-1",
        sourceVersionId: ctx.sourceVersion.id,
        sourceImageIndex: 0,
        presetKey: "not-a-real-preset",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects editing a version that isn't completed yet", async () => {
    const ctx = await setup();
    const pendingGeneration = await ctx.generations.addVersion(ctx.generationId, {
      promptVersionId: ctx.sourceVersion.promptVersionId,
    });

    await expect(
      ctx.create.execute({
        projectId: ctx.projectId,
        userId: "user-1",
        sourceVersionId: pendingGeneration.currentVersion.id,
        sourceImageIndex: 0,
        presetKey: "simpler",
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects an out-of-range image index", async () => {
    const ctx = await setup();
    await expect(
      ctx.create.execute({
        projectId: ctx.projectId,
        userId: "user-1",
        sourceVersionId: ctx.sourceVersion.id,
        sourceImageIndex: 99,
        presetKey: "simpler",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("creates a new pending version + edit history entry without touching the source (원본 이미지 보존)", async () => {
    const ctx = await setup();

    const edit = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      sourceVersionId: ctx.sourceVersion.id,
      sourceImageIndex: 0,
      presetKey: "more_minimal",
    });

    expect(edit.status).toBe("pending");
    expect(edit.resultVersionId).not.toBe(ctx.sourceVersion.id);
    expect(ctx.queue.enqueued).toEqual([{ editHistoryId: edit.id }]);

    const untouchedSource = await ctx.generations.getVersionById(ctx.sourceVersion.id);
    expect(untouchedSource?.images).toHaveLength(2);
    expect(untouchedSource?.status).toBe("completed");
  });

  it("blocks editing once the plan's monthly limit is reached (구독 한도 초과)", async () => {
    const ctx = await setup();
    ctx.subs.setPlan("user-1", "free");
    ctx.usage.seed(
      { userId: "user-1", eventType: GENERATION_EVENT_TYPE, quantity: PLAN_LIMITS.free.monthlyGenerationLimit },
      new Date(),
    );

    await expect(
      ctx.create.execute({
        projectId: ctx.projectId,
        userId: "user-1",
        sourceVersionId: ctx.sourceVersion.id,
        sourceImageIndex: 0,
        presetKey: "simpler",
      }),
    ).rejects.toBeInstanceOf(UsageLimitError);
  });
});

describe("ProcessEditJobUseCase", () => {
  it("completes an edit and records usage without a currentStep change (모든 프리셋 동작)", async () => {
    const ctx = await setup();
    const edit = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      sourceVersionId: ctx.sourceVersion.id,
      sourceImageIndex: 0,
      presetKey: "layout_change",
    });

    await ctx.process.execute({ editHistoryId: edit.id, isFinalAttempt: true });

    const completedEdit = await ctx.edits.getById(edit.id);
    expect(completedEdit?.status).toBe("completed");
    const resultVersion = await ctx.generations.getVersionById(edit.resultVersionId);
    expect(resultVersion?.status).toBe("completed");
    expect(resultVersion?.images).toHaveLength(1);
    expect(ctx.usage.records).toHaveLength(1);
  });

  it("marks an edit failed only on the final attempt (Provider 실패 / Queue 재시도)", async () => {
    const ctx = await setup();
    const failingPrompt = await ctx.prompts.createWithFirstVersion("other-project", {
      ...PROMPT_INPUT,
      userPrompt: FORCE_FAILURE_MARKER,
    });
    // Append as a new version of the *same* Generation (a project only ever
    // has one Generation record) rather than createWithFirstVersion, which
    // would spin up an unrelated second Generation.
    const failingGeneration = await ctx.generations.addVersion(ctx.generationId, {
      promptVersionId: failingPrompt.currentVersion.id,
    });
    await ctx.generations.updateVersionResult(failingGeneration.currentVersion.id, {
      status: "completed",
      images: [{ url: "data:image/svg+xml;base64,AAA", thumbnailUrl: "x" }],
      completedAt: new Date(),
    });
    const edit = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      sourceVersionId: failingGeneration.currentVersion.id,
      sourceImageIndex: 0,
      presetKey: "simpler",
    });

    await expect(ctx.process.execute({ editHistoryId: edit.id, isFinalAttempt: false })).rejects.toThrow();
    let current = await ctx.edits.getById(edit.id);
    expect(current?.status).toBe("processing");

    await ctx.process.execute({ editHistoryId: edit.id, isFinalAttempt: true });
    current = await ctx.edits.getById(edit.id);
    expect(current?.status).toBe("failed");
    expect(current?.errorMessage).toBeTruthy();
    const resultVersion = await ctx.generations.getVersionById(edit.resultVersionId);
    expect(resultVersion?.status).toBe("failed");
  });
});

describe("RetryEditUseCase / GetEditHistoryUseCase", () => {
  it("retries a failed edit as a new version (연속 수정)", async () => {
    const ctx = await setup();
    const first = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      sourceVersionId: ctx.sourceVersion.id,
      sourceImageIndex: 1,
      presetKey: "change_color",
    });
    await ctx.process.execute({ editHistoryId: first.id, isFinalAttempt: true });

    const retried = await ctx.retry.execute({ editHistoryId: first.id, userId: "user-1" });
    expect(retried.id).not.toBe(first.id);
    expect(retried.sourceImageIndex).toBe(1);
    expect(retried.presetKey).toBe("change_color");

    const history = await ctx.getHistory.execute({ generationId: ctx.generationId, userId: "user-1" });
    expect(history).toHaveLength(2);
  });

  it("rejects retry from a user who doesn't own the project (권한 검증)", async () => {
    const ctx = await setup();
    const edit = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      sourceVersionId: ctx.sourceVersion.id,
      sourceImageIndex: 0,
      presetKey: "simpler",
    });

    await expect(ctx.retry.execute({ editHistoryId: edit.id, userId: "someone-else" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("returns each entry with its resolved result version (버전 비교)", async () => {
    const ctx = await setup();
    const edit = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      sourceVersionId: ctx.sourceVersion.id,
      sourceImageIndex: 0,
      presetKey: "icon_only",
    });
    await ctx.process.execute({ editHistoryId: edit.id, isFinalAttempt: true });

    const history = await ctx.getHistory.execute({ generationId: ctx.generationId, userId: "user-1" });
    expect(history[0]?.resultVersion?.status).toBe("completed");
  });
});

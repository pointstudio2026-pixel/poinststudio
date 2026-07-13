import { describe, expect, it, vi } from "vitest";
import { CreateGenerationUseCase } from "@/modules/generations/application/CreateGenerationUseCase";
import { RetryGenerationUseCase } from "@/modules/generations/application/RetryGenerationUseCase";
import { GetGenerationUseCase } from "@/modules/generations/application/GetGenerationUseCase";
import { GetGenerationStatusUseCase } from "@/modules/generations/application/GetGenerationStatusUseCase";
import { ProcessGenerationJobUseCase } from "@/modules/generations/application/ProcessGenerationJobUseCase";
import { FakeGenerationRepository, FakeImageGenerationQueue } from "@/modules/generations/testing/fakes";
import { BuildPromptUseCase } from "@/modules/prompts/application/BuildPromptUseCase";
import { FakePromptRepository } from "@/modules/prompts/testing/fakes";
import { FakeBrandBriefRepository } from "@/modules/brandBriefs/testing/fakes";
import type { BrandBriefData } from "@/modules/brandBriefs/domain/BrandBrief";
import { FakeBrandStrategyRepository } from "@/modules/brandStrategies/testing/fakes";
import type { BrandStrategyData } from "@/modules/brandStrategies/domain/BrandStrategy";
import { FakeStyleRepository, FakeStyleSelectionRepository } from "@/modules/styles/testing/fakes";
import type { Style } from "@/modules/styles/domain/Style";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { CheckPlanUseCase } from "@/modules/subscriptions/application/CheckPlanUseCase";
import { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import { FakeSubscriptionRepository, FakeUsageRepository } from "@/modules/subscriptions/testing/fakes";
import { GENERATION_EVENT_TYPE, PLAN_LIMITS } from "@/modules/subscriptions/domain/planLimits";
import { MockImageGenerationProvider, FORCE_FAILURE_MARKER } from "@/shared/ai/MockImageGenerationProvider";
import { ConflictError, NotFoundError, UsageLimitError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

const BRIEF_DATA: BrandBriefData = {
  brandName: "Aster Bakery",
  industry: "bakery",
  tagline: "Aster Bakery — cozy",
  description: "fresh bread",
  mission: "fresh bread every morning",
  vision: "trusted bakery",
  coreValues: ["quality"],
  positioning: "친근한 동네 베이커리",
  primaryAudience: "local families",
  secondaryAudience: "",
  customerProblems: "",
  desiredImpression: "cozy",
  brandTone: "친근한",
  brandPersonality: "친근한",
  keywords: ["bakery"],
  avoidKeywords: [],
  preferredStyle: "미니멀",
  preferredColor: "중성",
  preferredSymbol: "심플",
  typographyDirection: "산세리프",
};

const STRATEGY_DATA: BrandStrategyData = {
  brandKnowledge: {
    mission: "fresh bread",
    vision: "trusted bakery",
    values: ["quality"],
    positioning: "친근한 동네 베이커리",
    audience: "local families",
    tone: "친근한",
    personality: "친근한",
    visualDirection: "미니멀",
    confidenceNotes: "",
    reasoningSummary: "",
  },
  brandStrategy: {
    positioning: "친근한 동네 베이커리",
    coreMessage: "매일 아침 신선하게",
    toneAndManner: "친근한",
    personality: "친근한",
    brandArchetype: "동반자 (The Everyman)",
    visualDirection: "미니멀",
    recommendedStyles: [],
    recommendedColors: [],
    recommendedTypography: [],
    recommendedSymbols: [],
  },
  styleCandidates: [{ name: "Minimal", reason: "" }],
  confidenceScore: 0.7,
};

const PRIMARY_STYLE: Style = {
  id: "style-1",
  name: "Monochrome Bold",
  slug: "minimal-monochrome-bold",
  level: 3,
  parentId: "parent-1",
  category: "Minimal",
  keywords: ["미니멀"],
  description: "설명",
};

async function setup() {
  const projects = new FakeProjectRepository();
  const briefs = new FakeBrandBriefRepository();
  const strategies = new FakeBrandStrategyRepository();
  const styles = new FakeStyleRepository();
  const selections = new FakeStyleSelectionRepository();
  const prompts = new FakePromptRepository();
  const generations = new FakeGenerationRepository();
  const queue = new FakeImageGenerationQueue();
  const subs = new FakeSubscriptionRepository();
  const usage = new FakeUsageRepository();
  const checkPlan = new CheckPlanUseCase(subs, usage);
  const recordUsage = new RecordUsageUseCase(usage);
  const provider = new MockImageGenerationProvider();

  const { projectId } = await new CreateProjectUseCase(projects).execute({ userId: "user-1", name: "Bakery" });

  const buildPrompt = new BuildPromptUseCase(projects, briefs, strategies, styles, selections, prompts);

  return {
    projectId,
    projects,
    briefs,
    strategies,
    styles,
    selections,
    prompts,
    generations,
    queue,
    subs,
    usage,
    create: new CreateGenerationUseCase(projects, prompts, buildPrompt, checkPlan, generations, queue),
    retry: new RetryGenerationUseCase(projects, prompts, checkPlan, generations, queue),
    get: new GetGenerationUseCase(projects, generations),
    getStatus: new GetGenerationStatusUseCase(projects, generations),
    process: new ProcessGenerationJobUseCase(projects, prompts, generations, recordUsage, provider),
  };
}

async function fullyReady(ctx: Awaited<ReturnType<typeof setup>>) {
  await ctx.briefs.createWithFirstVersion(ctx.projectId, BRIEF_DATA, "ai");
  await ctx.strategies.createWithFirstVersion(ctx.projectId, STRATEGY_DATA, "", "medium");
  ctx.styles.styles = [PRIMARY_STYLE];
  await ctx.selections.create(ctx.projectId, PRIMARY_STYLE.id, []);
}

describe("CreateGenerationUseCase", () => {
  it("blocks generation once the Prompt Engine's own prerequisites are missing", async () => {
    const ctx = await setup();
    await expect(ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" })).rejects.toBeInstanceOf(
      ConflictError,
    );
  });

  it("auto-builds a Prompt on first use and enqueues a pending version (정상 생성)", async () => {
    const ctx = await setup();
    await fullyReady(ctx);

    const version = await ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" });

    expect(version.status).toBe("pending");
    expect(version.versionNumber).toBe(1);
    expect(ctx.queue.enqueued).toEqual([{ generationVersionId: version.id }]);
    expect(await ctx.prompts.findByProjectId(ctx.projectId)).not.toBeNull();
  });

  it("blocks generation once the plan's monthly limit is reached (구독 한도 초과)", async () => {
    const ctx = await setup();
    await fullyReady(ctx);
    ctx.subs.setPlan("user-1", "free");
    ctx.usage.seed(
      { userId: "user-1", eventType: GENERATION_EVENT_TYPE, quantity: PLAN_LIMITS.free.monthlyGenerationLimit },
      new Date(),
    );

    await expect(ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" })).rejects.toBeInstanceOf(
      UsageLimitError,
    );
  });

  it("supports multiple generations for the same project (동일 프로젝트 다중 생성)", async () => {
    const ctx = await setup();
    await fullyReady(ctx);

    await ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" });
    const second = await ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" });

    expect(second.versionNumber).toBe(2);
  });
});

describe("ProcessGenerationJobUseCase", () => {
  it("completes a pending version, records usage, and advances the project step (정상 생성)", async () => {
    const ctx = await setup();
    await fullyReady(ctx);
    const project = ctx.projects.projects.find((p) => p.id === ctx.projectId)!;
    project.currentStep = "generation";
    const version = await ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" });

    await ctx.process.execute({ generationVersionId: version.id, isFinalAttempt: true });

    const completed = await ctx.generations.getVersionById(version.id);
    expect(completed?.status).toBe("completed");
    expect(completed?.images.length).toBeGreaterThan(0);
    expect(completed?.provider).toBe("mock");

    expect(ctx.usage.records).toHaveLength(1);
    expect(ctx.usage.records[0]?.eventType).toBe(GENERATION_EVENT_TYPE);

    const updatedProject = await ctx.projects.findByIdForUser(ctx.projectId, "user-1");
    expect(updatedProject?.currentStep).toBe("concept_board");
  });

  it("marks a version failed only on the final attempt, otherwise rethrows for BullMQ to retry (Provider 장애 / 재시도)", async () => {
    const ctx = await setup();
    // Force the Mock provider to fail by making the Brand Brief's brand
    // name (which flows into the prompt's user text) contain the marker.
    await ctx.briefs.createWithFirstVersion(ctx.projectId, { ...BRIEF_DATA, brandName: FORCE_FAILURE_MARKER }, "ai");
    await ctx.strategies.createWithFirstVersion(ctx.projectId, STRATEGY_DATA, "", "medium");
    ctx.styles.styles = [PRIMARY_STYLE];
    await ctx.selections.create(ctx.projectId, PRIMARY_STYLE.id, []);
    const version = await ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" });

    await expect(
      ctx.process.execute({ generationVersionId: version.id, isFinalAttempt: false }),
    ).rejects.toThrow();
    let current = await ctx.generations.getVersionById(version.id);
    expect(current?.status).toBe("processing");

    await ctx.process.execute({ generationVersionId: version.id, isFinalAttempt: true });
    current = await ctx.generations.getVersionById(version.id);
    expect(current?.status).toBe("failed");
    expect(current?.errorMessage).toBeTruthy();
  });
});

describe("RetryGenerationUseCase", () => {
  it("creates a new version referencing the latest prompt (생성 실패 후 재시도)", async () => {
    const ctx = await setup();
    await fullyReady(ctx);
    const first = await ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" });
    await ctx.process.execute({ generationVersionId: first.id, isFinalAttempt: true });

    const retried = await ctx.retry.execute({ generationVersionId: first.id, userId: "user-1" });

    expect(retried.versionNumber).toBe(2);
    expect(retried.status).toBe("pending");
    expect(ctx.queue.enqueued).toHaveLength(2);
  });

  it("rejects retry from a user who doesn't own the project", async () => {
    const ctx = await setup();
    await fullyReady(ctx);
    const version = await ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" });

    await expect(
      ctx.retry.execute({ generationVersionId: version.id, userId: "someone-else" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("GetGenerationUseCase / GetGenerationStatusUseCase", () => {
  it("returns the current version plus full history", async () => {
    const ctx = await setup();
    await fullyReady(ctx);
    await ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" });
    await ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" });

    const { generation, versions } = await ctx.get.execute({ projectId: ctx.projectId, userId: "user-1" });
    expect(generation.currentVersion.versionNumber).toBe(2);
    expect(versions).toHaveLength(2);
  });

  it("polls a specific version's status by id (진행 상태 확인)", async () => {
    const ctx = await setup();
    await fullyReady(ctx);
    const version = await ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" });

    const status = await ctx.getStatus.execute({ generationVersionId: version.id, userId: "user-1" });
    expect(status.status).toBe("pending");
  });

  it("rejects access from a user who doesn't own the project (권한 검증)", async () => {
    const ctx = await setup();
    await fullyReady(ctx);
    const version = await ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" });

    await expect(
      ctx.getStatus.execute({ generationVersionId: version.id, userId: "someone-else" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

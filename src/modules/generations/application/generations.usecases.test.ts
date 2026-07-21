import { describe, expect, it, vi } from "vitest";
import { CreateGenerationUseCase } from "@/modules/generations/application/CreateGenerationUseCase";
import { RetryGenerationUseCase } from "@/modules/generations/application/RetryGenerationUseCase";
import { GetGenerationUseCase } from "@/modules/generations/application/GetGenerationUseCase";
import { GetGenerationStatusUseCase } from "@/modules/generations/application/GetGenerationStatusUseCase";
import { ProcessGenerationJobUseCase } from "@/modules/generations/application/ProcessGenerationJobUseCase";
import { FakeGenerationRepository, FakeImageGenerationQueue } from "@/modules/generations/testing/fakes";
import { BuildPromptUseCase } from "@/modules/prompts/application/BuildPromptUseCase";
import { FakePromptRepository } from "@/modules/prompts/testing/fakes";
import { FakeInterviewRepository } from "@/modules/interviews/testing/fakes";
import { GetOrStartInterviewUseCase } from "@/modules/interviews/application/GetOrStartInterviewUseCase";
import { SaveAnswerUseCase } from "@/modules/interviews/application/SaveAnswerUseCase";
import { CompleteInterviewUseCase } from "@/modules/interviews/application/CompleteInterviewUseCase";
import { INTERVIEW_QUESTIONS } from "@/modules/interviews/domain/interviewQuestions";
import { FakeBrandStrategyRepository } from "@/modules/brandStrategies/testing/fakes";
import type { BrandStrategyData } from "@/modules/brandStrategies/domain/BrandStrategy";
import { FakeStyleRepository, FakeStyleSelectionRepository } from "@/modules/styles/testing/fakes";
import type { Style } from "@/modules/styles/domain/Style";
import { FakeLogoStyleCategoryRepository, FakeLogoStyleSelectionRepository } from "@/modules/logoStyles/testing/fakes";
import type { LogoStyleCategory } from "@/modules/logoStyles/domain/LogoStyle";
import { FakeUserStyleCategoryRepository, FakeProjectUserStyleSelectionRepository } from "@/modules/userStyles/testing/fakes";
import { FakeColorPaletteSelectionRepository } from "@/modules/colorPalettes/testing/fakes";
import { EnsureEmailVerifiedUseCase } from "@/modules/auth/application/EnsureEmailVerifiedUseCase";
import { FakeUserRepository } from "@/modules/auth/testing/fakes";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { SelectDeliverableTypeUseCase } from "@/modules/projects/application/SelectDeliverableTypeUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { CheckPlanUseCase } from "@/modules/subscriptions/application/CheckPlanUseCase";
import { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import { FakeSubscriptionRepository, FakeUsageRepository } from "@/modules/subscriptions/testing/fakes";
import { GENERATION_EVENT_TYPE, PLAN_LIMITS } from "@/modules/subscriptions/domain/planLimits";
import { FORCE_FAILURE_MARKER } from "@/shared/ai/MockImageGenerationProvider";
import { ConflictError, NotFoundError, UsageLimitError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

const STRATEGY_DATA: BrandStrategyData = {
  brandKnowledge: {
    industry: "bakery",
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
    tagline: "Aster Bakery — cozy",
    keywords: ["bakery"],
    preferredColor: "중성",
    typographyDirection: "산세리프",
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

const LOGO_STYLE_CATEGORY: LogoStyleCategory = {
  id: "logo-style-1",
  slug: "symbol-focused",
  name: "심볼 중심",
  description: "심플한 심볼을 중심으로 브랜드를 표현합니다.",
  subStyles: ["미니멀심볼"],
  keywords: ["심볼"],
  sampleImageUrl: "/logo-styles/symbol.svg",
  sortOrder: 1,
};

async function setup() {
  const projects = new FakeProjectRepository();
  const interviews = new FakeInterviewRepository();
  const strategies = new FakeBrandStrategyRepository();
  const styles = new FakeStyleRepository();
  const selections = new FakeStyleSelectionRepository();
  const logoStyleCategories = new FakeLogoStyleCategoryRepository();
  const logoStyleSelections = new FakeLogoStyleSelectionRepository();
  const userStyleCategories = new FakeUserStyleCategoryRepository();
  const userStyleSelections = new FakeProjectUserStyleSelectionRepository();
  const colorPaletteSelections = new FakeColorPaletteSelectionRepository();
  const prompts = new FakePromptRepository();
  const generations = new FakeGenerationRepository();
  const queue = new FakeImageGenerationQueue();
  const subs = new FakeSubscriptionRepository();
  const usage = new FakeUsageRepository();
  const checkPlan = new CheckPlanUseCase(subs, usage);
  const recordUsage = new RecordUsageUseCase(usage);
  const users = new FakeUserRepository();
  // 첫 create() 호출은 항상 "user-1"을 만든다(FakeUserRepository의 auto-id가
  // 배열 길이 기반이라 이 파일 전체에서 쓰는 리터럴 "user-1"과 그대로 맞아떨어짐).
  await users.create({ email: "bakery@aster.dev", passwordHash: "hashed:x", emailVerifiedAt: new Date() });
  const ensureEmailVerified = new EnsureEmailVerifiedUseCase(users);

  const { projectId } = await new CreateProjectUseCase(projects).execute({ userId: "user-1", name: "Bakery" });
  await new SelectDeliverableTypeUseCase(projects).execute({
    projectId,
    userId: "user-1",
    deliverableType: "브랜딩 & 로고",
  });

  const buildPrompt = new BuildPromptUseCase(
    projects,
    interviews,
    strategies,
    styles,
    selections,
    logoStyleCategories,
    logoStyleSelections,
    userStyleCategories,
    userStyleSelections,
    colorPaletteSelections,
    prompts,
  );

  return {
    projectId,
    projects,
    interviews,
    strategies,
    styles,
    selections,
    logoStyleCategories,
    logoStyleSelections,
    userStyleCategories,
    userStyleSelections,
    prompts,
    generations,
    queue,
    subs,
    usage,
    users,
    create: new CreateGenerationUseCase(projects, prompts, buildPrompt, checkPlan, ensureEmailVerified, generations, queue),
    retry: new RetryGenerationUseCase(projects, prompts, checkPlan, generations, queue),
    get: new GetGenerationUseCase(projects, generations),
    getStatus: new GetGenerationStatusUseCase(projects, generations),
    process: new ProcessGenerationJobUseCase(projects, prompts, generations, recordUsage),
  };
}

async function completeInterview(
  ctx: { projects: FakeProjectRepository; interviews: FakeInterviewRepository; projectId: string },
  brandName = "Aster Bakery",
) {
  const getOrStart = new GetOrStartInterviewUseCase(ctx.projects, ctx.interviews);
  const saveAnswer = new SaveAnswerUseCase(ctx.projects, ctx.interviews);
  const complete = new CompleteInterviewUseCase(ctx.projects, ctx.interviews);

  await getOrStart.execute({ projectId: ctx.projectId, userId: "user-1" });
  for (const q of INTERVIEW_QUESTIONS.filter((q) => q.required)) {
    const answer = q.key === "brandName" ? brandName : `충분히 구체적인 ${q.key} 답변입니다.`;
    await saveAnswer.execute({ projectId: ctx.projectId, userId: "user-1", questionKey: q.key, answer });
  }
  await complete.execute({ projectId: ctx.projectId, userId: "user-1" });
}

async function selectStrategy(strategies: FakeBrandStrategyRepository, projectId: string) {
  const strategy = await strategies.createWithFirstVersion(
    projectId,
    [STRATEGY_DATA, STRATEGY_DATA, STRATEGY_DATA],
    "",
    "medium",
  );
  await strategies.selectCandidate(strategy.id, 0);
}

async function fullyReady(ctx: Awaited<ReturnType<typeof setup>>, brandName?: string) {
  await completeInterview(ctx, brandName);
  await selectStrategy(ctx.strategies, ctx.projectId);
  ctx.styles.styles = [PRIMARY_STYLE];
  await ctx.selections.create(ctx.projectId, PRIMARY_STYLE.id, []);
  ctx.logoStyleCategories.categories = [LOGO_STYLE_CATEGORY];
  await ctx.logoStyleSelections.create(ctx.projectId, [LOGO_STYLE_CATEGORY.id], LOGO_STYLE_CATEGORY.id);
}

describe("CreateGenerationUseCase", () => {
  it("blocks generation for an unverified email (무료 플랜 어뷰징 방어)", async () => {
    const ctx = await setup();
    // setup()이 만드는 "user-1"은 인증됨 상태이므로, 이 테스트만 새로
    // 미인증 사용자 + 그 사용자 소유 프로젝트를 만들어 게이팅을 직접
    // 확인한다(이메일 인증 체크가 소유권 체크 다음, Prompt Engine
    // 사전조건 체크보다 먼저 실행되므로 "완전히 준비된" 프로젝트일
    // 필요는 없다).
    const unverified = await ctx.users.create({ email: "unverified@aster.dev", passwordHash: "hashed:x" });
    const { projectId } = await new CreateProjectUseCase(ctx.projects).execute({
      userId: unverified.id,
      name: "Unverified User's Project",
    });

    await expect(
      ctx.create.execute({ projectId, userId: unverified.id }),
    ).rejects.toMatchObject({ code: "EMAIL_NOT_VERIFIED" });
  });

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
    expect(ctx.queue.enqueued).toEqual([{ generationVersionId: version.id, requestedByUserId: "user-1" }]);
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

  it("rejects a 4th result once the project already has 3 (프로젝트당 결과 3개 캡)", async () => {
    const ctx = await setup();
    await fullyReady(ctx);
    const first = await ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" });
    // "실패"만 캡에서 제외되므로 completed 2개를 더 채우면(첫 pending 포함
    // 총 3개) 다음 시도는 완료 여부와 무관하게 막혀야 한다.
    ctx.generations.versions.push(
      { ...first, id: "v-extra-1", versionNumber: 2, status: "completed" },
      { ...first, id: "v-extra-2", versionNumber: 3, status: "completed" },
    );

    await expect(
      ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" }),
    ).rejects.toBeInstanceOf(UsageLimitError);
  });

  it("does not count a failed result against the 3-result cap (실패는 캡에 안 잡힘)", async () => {
    const ctx = await setup();
    await fullyReady(ctx);
    const first = await ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" });
    ctx.generations.versions.push(
      { ...first, id: "v-extra-1", versionNumber: 2, status: "completed" },
      { ...first, id: "v-extra-2", versionNumber: 3, status: "failed" },
    );

    const fourth = await ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" });
    expect(fourth.versionNumber).toBe(4);
  });
});

describe("ProcessGenerationJobUseCase", () => {
  it("completes a pending version, records usage, and advances the project step (정상 생성)", async () => {
    const ctx = await setup();
    await fullyReady(ctx);
    const project = ctx.projects.projects.find((p) => p.id === ctx.projectId)!;
    project.currentStep = "generation";
    const version = await ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" });

    await ctx.process.execute({ generationVersionId: version.id, requestedByUserId: "user-1", isFinalAttempt: true });

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
    // Force the Mock provider to fail by making the interview's brand name
    // (which flows into the prompt's user text) contain the marker.
    await fullyReady(ctx, FORCE_FAILURE_MARKER);
    const version = await ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" });

    await expect(
      ctx.process.execute({ generationVersionId: version.id, requestedByUserId: "user-1", isFinalAttempt: false }),
    ).rejects.toThrow();
    let current = await ctx.generations.getVersionById(version.id);
    expect(current?.status).toBe("processing");

    await ctx.process.execute({ generationVersionId: version.id, requestedByUserId: "user-1", isFinalAttempt: true });
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
    await ctx.process.execute({ generationVersionId: first.id, requestedByUserId: "user-1", isFinalAttempt: true });

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

  it("rejects retry once the project already has 3 results (프로젝트당 결과 3개 캡)", async () => {
    const ctx = await setup();
    await fullyReady(ctx);
    const first = await ctx.create.execute({ projectId: ctx.projectId, userId: "user-1" });
    await ctx.process.execute({ generationVersionId: first.id, requestedByUserId: "user-1", isFinalAttempt: true });
    ctx.generations.versions.push(
      { ...first, id: "v-extra-1", versionNumber: 2, status: "completed" },
      { ...first, id: "v-extra-2", versionNumber: 3, status: "completed" },
    );

    await expect(
      ctx.retry.execute({ generationVersionId: first.id, userId: "user-1" }),
    ).rejects.toBeInstanceOf(UsageLimitError);
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

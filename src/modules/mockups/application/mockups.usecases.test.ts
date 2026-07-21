import { describe, expect, it, vi } from "vitest";
import { CreateMockupUseCase } from "@/modules/mockups/application/CreateMockupUseCase";
import { GetMockupsUseCase } from "@/modules/mockups/application/GetMockupsUseCase";
import { GetMockupTemplatesUseCase } from "@/modules/mockups/application/GetMockupTemplatesUseCase";
import { ToggleMockupFavoriteUseCase } from "@/modules/mockups/application/ToggleMockupFavoriteUseCase";
import { DeleteMockupUseCase } from "@/modules/mockups/application/DeleteMockupUseCase";
import { ProcessMockupJobUseCase } from "@/modules/mockups/application/ProcessMockupJobUseCase";
import { FakeMockupRepository, FakeMockupRenderQueue, FakeMockupTemplateRepository } from "@/modules/mockups/testing/fakes";
import type { MockupTemplate } from "@/modules/mockups/domain/Mockup";
import { FakeGenerationRepository } from "@/modules/generations/testing/fakes";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { CheckPlanUseCase } from "@/modules/subscriptions/application/CheckPlanUseCase";
import { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import { FakeSubscriptionRepository, FakeUsageRepository } from "@/modules/subscriptions/testing/fakes";
import { GENERATION_EVENT_TYPE, PLAN_LIMITS } from "@/modules/subscriptions/domain/planLimits";
import { MockMockupRenderProvider, FORCE_FAILURE_MARKER } from "@/shared/ai/MockMockupRenderProvider";
import { ConflictError, NotFoundError, UsageLimitError, ValidationError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

const TEMPLATE: MockupTemplate = {
  id: "template-1",
  category: "business_card",
  name: "Business Card (Cream)",
  slug: "business-card-cream",
  description: "설명",
  backgroundUrl: "data:image/svg+xml;base64,AAA",
  placementArea: { xPct: 30, yPct: 35, widthPct: 40, heightPct: 30 },
};

async function setup() {
  const projects = new FakeProjectRepository();
  const generations = new FakeGenerationRepository();
  const templates = new FakeMockupTemplateRepository();
  const mockups = new FakeMockupRepository();
  const queue = new FakeMockupRenderQueue();
  const subs = new FakeSubscriptionRepository();
  const usage = new FakeUsageRepository();
  const checkPlan = new CheckPlanUseCase(subs, usage);
  const recordUsage = new RecordUsageUseCase(usage);
  const provider = new MockMockupRenderProvider();

  templates.templates = [TEMPLATE];

  const { projectId } = await new CreateProjectUseCase(projects).execute({ userId: "user-1", name: "Bakery" });
  const generation = await generations.createWithFirstVersion(projectId, { promptVersionId: "prompt-1" });
  await generations.updateVersionResult(generation.currentVersion.id, {
    status: "completed",
    images: [
      { url: "data:image/svg+xml;base64,LOGO1", thumbnailUrl: "t1" },
      { url: "data:image/svg+xml;base64,LOGO2", thumbnailUrl: "t2" },
    ],
    completedAt: new Date(),
  });
  const sourceVersion = await generations.getVersionById(generation.currentVersion.id);

  return {
    projectId,
    sourceVersion: sourceVersion!,
    projects,
    generations,
    templates,
    mockups,
    queue,
    subs,
    usage,
    create: new CreateMockupUseCase(projects, generations, templates, checkPlan, mockups, queue),
    getMockups: new GetMockupsUseCase(projects, mockups),
    getTemplates: new GetMockupTemplatesUseCase(templates),
    favorite: new ToggleMockupFavoriteUseCase(projects, mockups),
    remove: new DeleteMockupUseCase(projects, mockups),
    process: new ProcessMockupJobUseCase(projects, generations, mockups, templates, recordUsage, provider),
  };
}

describe("CreateMockupUseCase", () => {
  it("rejects a source version that isn't completed", async () => {
    const ctx = await setup();
    const pending = await ctx.generations.addVersion(ctx.sourceVersion.generationId, {
      promptVersionId: ctx.sourceVersion.promptVersionId,
    });

    await expect(
      ctx.create.execute({
        projectId: ctx.projectId,
        userId: "user-1",
        generationVersionId: pending.currentVersion.id,
        sourceImageIndex: 0,
        templateId: TEMPLATE.id,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("rejects an out-of-range image index", async () => {
    const ctx = await setup();
    await expect(
      ctx.create.execute({
        projectId: ctx.projectId,
        userId: "user-1",
        generationVersionId: ctx.sourceVersion.id,
        sourceImageIndex: 99,
        templateId: TEMPLATE.id,
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects an unknown template", async () => {
    const ctx = await setup();
    await expect(
      ctx.create.execute({
        projectId: ctx.projectId,
        userId: "user-1",
        generationVersionId: ctx.sourceVersion.id,
        sourceImageIndex: 0,
        templateId: "not-a-real-template",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("creates a pending mockup and enqueues a job (정상 생성 / 템플릿 변경)", async () => {
    const ctx = await setup();
    const mockup = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      generationVersionId: ctx.sourceVersion.id,
      sourceImageIndex: 1,
      templateId: TEMPLATE.id,
    });

    expect(mockup.status).toBe("pending");
    expect(mockup.sourceImageIndex).toBe(1);
    expect(ctx.queue.enqueued).toEqual([{ mockupId: mockup.id, requestedByUserId: "user-1" }]);
  });

  it("supports creating multiple mockups for the same project (여러 Mockup 생성)", async () => {
    const ctx = await setup();
    await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      generationVersionId: ctx.sourceVersion.id,
      sourceImageIndex: 0,
      templateId: TEMPLATE.id,
    });
    await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      generationVersionId: ctx.sourceVersion.id,
      sourceImageIndex: 1,
      templateId: TEMPLATE.id,
    });

    const list = await ctx.getMockups.execute({ projectId: ctx.projectId, userId: "user-1" });
    expect(list).toHaveLength(2);
  });

  it("blocks rendering once the plan's monthly limit is reached (사용량 기록 / 한도)", async () => {
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
        generationVersionId: ctx.sourceVersion.id,
        sourceImageIndex: 0,
        templateId: TEMPLATE.id,
      }),
    ).rejects.toBeInstanceOf(UsageLimitError);
  });
});

describe("ProcessMockupJobUseCase", () => {
  it("completes a mockup render and records usage", async () => {
    const ctx = await setup();
    const mockup = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      generationVersionId: ctx.sourceVersion.id,
      sourceImageIndex: 0,
      templateId: TEMPLATE.id,
    });

    await ctx.process.execute({ mockupId: mockup.id, requestedByUserId: "user-1", isFinalAttempt: true });

    const completed = await ctx.mockups.getById(mockup.id);
    expect(completed?.status).toBe("completed");
    expect(completed?.resultImageUrl).toBeTruthy();
    expect(completed?.provider).toBe("mock");
    expect(ctx.usage.records).toHaveLength(1);
  });

  it("marks a mockup failed only on the final attempt (렌더 실패 재시도)", async () => {
    const ctx = await setup();
    ctx.templates.templates.push({ ...TEMPLATE, id: "template-fail", name: FORCE_FAILURE_MARKER });
    const mockup = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      generationVersionId: ctx.sourceVersion.id,
      sourceImageIndex: 0,
      templateId: "template-fail",
    });

    await expect(ctx.process.execute({ mockupId: mockup.id, requestedByUserId: "user-1", isFinalAttempt: false })).rejects.toThrow();
    let current = await ctx.mockups.getById(mockup.id);
    expect(current?.status).toBe("processing");

    await ctx.process.execute({ mockupId: mockup.id, requestedByUserId: "user-1", isFinalAttempt: true });
    current = await ctx.mockups.getById(mockup.id);
    expect(current?.status).toBe("failed");
    expect(current?.errorMessage).toBeTruthy();
  });
});

describe("Favorites / Delete / Templates", () => {
  it("toggles favorite status", async () => {
    const ctx = await setup();
    const mockup = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      generationVersionId: ctx.sourceVersion.id,
      sourceImageIndex: 0,
      templateId: TEMPLATE.id,
    });

    const favorited = await ctx.favorite.execute({ mockupId: mockup.id, userId: "user-1", favorite: true });
    expect(favorited.isFavorite).toBe(true);
  });

  it("deletes a mockup, and rejects access from a non-owner", async () => {
    const ctx = await setup();
    const mockup = await ctx.create.execute({
      projectId: ctx.projectId,
      userId: "user-1",
      generationVersionId: ctx.sourceVersion.id,
      sourceImageIndex: 0,
      templateId: TEMPLATE.id,
    });

    await expect(ctx.remove.execute({ mockupId: mockup.id, userId: "someone-else" })).rejects.toBeInstanceOf(
      NotFoundError,
    );

    await ctx.remove.execute({ mockupId: mockup.id, userId: "user-1" });
    expect(await ctx.mockups.getById(mockup.id)).toBeNull();
  });

  it("lists templates and their categories", async () => {
    const ctx = await setup();
    const { templates, categories } = await ctx.getTemplates.execute({});
    expect(templates).toHaveLength(1);
    expect(categories).toContain("business_card");
  });
});

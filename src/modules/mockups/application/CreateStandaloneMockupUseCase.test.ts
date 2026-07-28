import { describe, expect, it, vi } from "vitest";
import { CreateStandaloneMockupUseCase } from "@/modules/mockups/application/CreateStandaloneMockupUseCase";
import { FakeMockupTemplateRepository, FakeStandaloneMockupRepository } from "@/modules/mockups/testing/fakes";
import type { MockupTemplate } from "@/modules/mockups/domain/Mockup";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import { CheckPlanUseCase } from "@/modules/subscriptions/application/CheckPlanUseCase";
import { RecordUsageUseCase } from "@/modules/subscriptions/application/RecordUsageUseCase";
import { FakeSubscriptionRepository, FakeUsageRepository } from "@/modules/subscriptions/testing/fakes";
import { GENERATION_EVENT_TYPE, PLAN_LIMITS } from "@/modules/subscriptions/domain/planLimits";
import { MockMockupRenderProvider, FORCE_FAILURE_MARKER } from "@/shared/ai/MockMockupRenderProvider";
import { FakeFileStorage } from "@/shared/storage/testing/FakeFileStorage";
import { NotFoundError, UsageLimitError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

const TEMPLATE: MockupTemplate = {
  id: "template-1",
  category: "signboard",
  name: "Signboard (Cafe)",
  slug: "signboard-cafe",
  description: "설명",
  backgroundUrl: "data:image/svg+xml;base64,AAA",
  placementArea: { xPct: 30, yPct: 35, widthPct: 40, heightPct: 30 },
  keywords: ["카페", "간판"],
};

function setup() {
  const projects = new FakeProjectRepository();
  const templates = new FakeMockupTemplateRepository();
  const standaloneMockups = new FakeStandaloneMockupRepository();
  const fileStorage = new FakeFileStorage();
  const subs = new FakeSubscriptionRepository();
  const usage = new FakeUsageRepository();
  const checkPlan = new CheckPlanUseCase(subs, usage);
  const recordUsage = new RecordUsageUseCase(usage);
  const provider = new MockMockupRenderProvider();

  templates.templates = [TEMPLATE];

  const useCase = new CreateStandaloneMockupUseCase(
    projects,
    templates,
    standaloneMockups,
    fileStorage,
    provider,
    checkPlan,
    recordUsage,
  );

  return { projects, templates, standaloneMockups, fileStorage, subs, usage, useCase };
}

describe("CreateStandaloneMockupUseCase", () => {
  it("composites an uploaded logo, records usage, and creates a hidden shell project", async () => {
    const { projects, standaloneMockups, usage, useCase } = setup();

    const result = await useCase.execute({
      userId: "user-1",
      templateId: TEMPLATE.id,
      source: { type: "upload", data: Buffer.from("fake-png"), contentType: "image/png" },
    });

    expect(result.status).toBe("completed");
    expect(result.sourceType).toBe("upload");
    expect(result.resultImageUrl).toBeTruthy();
    expect(standaloneMockups.mockups).toHaveLength(1);

    const shellProjects = await projects.listForUser("user-1");
    expect(shellProjects).toHaveLength(0); // isStandaloneMockup projects must not show up in "내 프로젝트"

    const usedCount = usage.records.filter((r) => r.userId === "user-1" && r.eventType === GENERATION_EVENT_TYPE).length;
    expect(usedCount).toBe(1);
  });

  it("composites from a past-generation image URL without touching file storage", async () => {
    const { fileStorage, useCase } = setup();
    const readSpy = vi.spyOn(fileStorage, "read");

    const result = await useCase.execute({
      userId: "user-1",
      templateId: TEMPLATE.id,
      source: { type: "past_generation", imageUrl: "data:image/svg+xml;base64,LOGO" },
    });

    expect(result.sourceType).toBe("past_generation");
    expect(readSpy).not.toHaveBeenCalled();
  });

  it("throws UsageLimitError once the plan's monthly quota is exhausted", async () => {
    const { usage, useCase } = setup();
    const limit = PLAN_LIMITS.free.monthlyGenerationLimit;
    for (let i = 0; i < limit; i++) {
      await usage.record({ userId: "user-1", projectId: "other-project", eventType: GENERATION_EVENT_TYPE, quantity: 1 });
    }

    await expect(
      useCase.execute({
        userId: "user-1",
        templateId: TEMPLATE.id,
        source: { type: "past_generation", imageUrl: "data:image/svg+xml;base64,LOGO" },
      }),
    ).rejects.toBeInstanceOf(UsageLimitError);
  });

  it("throws NotFoundError for an unknown template", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({
        userId: "user-1",
        templateId: "does-not-exist",
        source: { type: "past_generation", imageUrl: "data:image/svg+xml;base64,LOGO" },
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("records a failed row and rethrows when compositing fails", async () => {
    const { templates, standaloneMockups, useCase } = setup();
    templates.templates = [{ ...TEMPLATE, name: `${TEMPLATE.name} ${FORCE_FAILURE_MARKER}` }];

    await expect(
      useCase.execute({
        userId: "user-1",
        templateId: TEMPLATE.id,
        source: { type: "past_generation", imageUrl: "data:image/svg+xml;base64,LOGO" },
      }),
    ).rejects.toThrow();

    expect(standaloneMockups.mockups).toHaveLength(1);
    expect(standaloneMockups.mockups[0]?.status).toBe("failed");
    expect(standaloneMockups.mockups[0]?.errorMessage).toBeTruthy();
  });
});

import { describe, expect, it, vi } from "vitest";
import { GetDashboardUseCase } from "@/modules/dashboard/application/GetDashboardUseCase";
import { ListProjectsUseCase } from "@/modules/projects/application/ListProjectsUseCase";
import { CreateProjectUseCase } from "@/modules/projects/application/CreateProjectUseCase";
import { GetSubscriptionUseCase } from "@/modules/subscriptions/application/GetSubscriptionUseCase";
import { GetUsageSummaryUseCase } from "@/modules/subscriptions/application/GetUsageSummaryUseCase";
import { FakeProjectRepository } from "@/modules/projects/testing/fakes";
import {
  FakeSubscriptionRepository,
  FakeUsageRepository,
} from "@/modules/subscriptions/testing/fakes";
import { GENERATION_EVENT_TYPE, PLAN_LIMITS } from "@/modules/subscriptions/domain/planLimits";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
  getRecentActivity: vi.fn().mockResolvedValue([
    { id: "log-1", eventType: "PROJECT_CREATED", projectId: "p-1", payload: {}, createdAt: new Date() },
  ]),
}));

function buildUseCase() {
  const projects = new FakeProjectRepository();
  const subs = new FakeSubscriptionRepository();
  const usage = new FakeUsageRepository();
  const useCase = new GetDashboardUseCase(
    new ListProjectsUseCase(projects),
    new GetSubscriptionUseCase(subs),
    new GetUsageSummaryUseCase(subs, usage),
  );
  return { projects, subs, usage, useCase, createProjectUseCase: new CreateProjectUseCase(projects) };
}

describe("GetDashboardUseCase", () => {
  it("returns an empty project list for a brand-new user (프로젝트 없음)", async () => {
    const { useCase } = buildUseCase();
    const result = await useCase.execute({ userId: "user-1", role: "designer" });

    expect(result.projects).toEqual([]);
    expect(result.subscription.planCode).toBe("free");
    expect(result.recentActivity).toHaveLength(1);
  });

  it("returns multiple projects, most recently updated first (프로젝트 다수)", async () => {
    const { useCase, createProjectUseCase } = buildUseCase();
    await createProjectUseCase.execute({ userId: "user-1", name: "Older" });
    await new Promise((r) => setTimeout(r, 5));
    await createProjectUseCase.execute({ userId: "user-1", name: "Newer" });

    const result = await useCase.execute({ userId: "user-1", role: "designer" });

    expect(result.projects).toHaveLength(2);
    expect(result.projects[0]?.name).toBe("Newer");
  });

  it("returns no projects for a search term that matches nothing (검색 결과 없음)", async () => {
    const { useCase, createProjectUseCase } = buildUseCase();
    await createProjectUseCase.execute({ userId: "user-1", name: "My Coffee Brand" });

    const result = await useCase.execute({ userId: "user-1", role: "designer", search: "zzz" });
    expect(result.projects).toEqual([]);
  });

  it("flags usage near the plan limit (사용량 한도 근접)", async () => {
    const { useCase, subs, usage } = buildUseCase();
    subs.setPlan("user-1", "free");
    usage.seed(
      { userId: "user-1", eventType: GENERATION_EVENT_TYPE, quantity: PLAN_LIMITS.free.monthlyGenerationLimit - 1 },
      new Date(),
    );

    const result = await useCase.execute({ userId: "user-1", role: "designer" });
    expect(result.usage.generation.remaining).toBe(1);
  });
});

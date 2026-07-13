import { describe, expect, it, vi } from "vitest";
import { GetAdminDashboardUseCase } from "@/modules/admin/application/GetAdminDashboardUseCase";
import { GetAdminAnalyticsUseCase } from "@/modules/admin/application/GetAdminAnalyticsUseCase";
import { SearchAdminUsersUseCase } from "@/modules/admin/application/SearchAdminUsersUseCase";
import { GetAuditLogsUseCase } from "@/modules/admin/application/GetAuditLogsUseCase";
import { GetProviderHealthUseCase } from "@/modules/admin/application/GetProviderHealthUseCase";
import {
  CreateAnnouncementUseCase,
  DeactivateAnnouncementUseCase,
  ListAnnouncementsUseCase,
} from "@/modules/admin/application/AnnouncementUseCases";
import { FakeAdminRepository, FakeAnnouncementRepository, FakeQueue } from "@/modules/admin/testing/fakes";
import { MockTextCompletionProvider } from "@/shared/ai/MockTextCompletionProvider";
import { MockImageGenerationProvider } from "@/shared/ai/MockImageGenerationProvider";
import { MockMockupRenderProvider } from "@/shared/ai/MockMockupRenderProvider";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";

vi.mock("@/shared/activity/activityLogger", () => ({
  recordActivity: vi.fn().mockResolvedValue(undefined),
}));

describe("GetAdminDashboardUseCase", () => {
  it("combines all summary widgets (통계 조회 / Provider 상태 / Queue 상태 확인)", async () => {
    const repo = new FakeAdminRepository();
    repo.dailyActiveUsers = 7;
    repo.newProjects = 2;
    repo.plans = [{ planCode: "free", userCount: 5 }];
    repo.errors = [{ jobType: "generation", total: 10, failed: 1, errorRate: 0.1 }];
    const queue = new FakeQueue();
    queue.counts = { waiting: 1, active: 2, completed: 3, failed: 4, delayed: 0 };

    const useCase = new GetAdminDashboardUseCase(
      repo,
      new MockTextCompletionProvider(),
      new MockImageGenerationProvider(),
      new MockMockupRenderProvider(),
      queue,
      queue,
      queue,
      queue,
    );

    const summary = await useCase.execute();

    expect(summary.dailyActiveUsers).toBe(7);
    expect(summary.newProjectsToday).toBe(2);
    expect(summary.planDistribution).toEqual([{ planCode: "free", userCount: 5 }]);
    expect(summary.providerHealth.every((p) => p.healthy)).toBe(true);
    expect(summary.queueStatus).toHaveLength(4);
    expect(summary.queueStatus[0]).toMatchObject({ waiting: 1, active: 2, completed: 3, failed: 4 });
    expect(summary.errorRates[0]?.errorRate).toBe(0.1);
  });
});

describe("GetAdminAnalyticsUseCase", () => {
  it("returns usage/cost trends and monthly total cost", async () => {
    const repo = new FakeAdminRepository();
    repo.trend = [{ date: "2026-07-01", count: 3 }];
    repo.costs = [{ date: "2026-07-01", costAmount: 0.12 }];
    repo.totalCost = 4.5;

    const analytics = await new GetAdminAnalyticsUseCase(repo).execute();

    expect(analytics.usageTrend).toEqual(repo.trend);
    expect(analytics.costTrend).toEqual(repo.costs);
    expect(analytics.totalCostThisMonth).toBe(4.5);
  });
});

describe("SearchAdminUsersUseCase", () => {
  it("filters users by query (사용자 검색)", async () => {
    const repo = new FakeAdminRepository();
    repo.users = [
      { id: "u1", email: "alice@aster.dev", role: "designer", planCode: "free", projectCount: 2, createdAt: new Date() },
      { id: "u2", email: "bob@aster.dev", role: "designer", planCode: "pro", projectCount: 1, createdAt: new Date() },
    ];

    const result = await new SearchAdminUsersUseCase(repo).execute({ query: "alice" });
    expect(result).toHaveLength(1);
    expect(result[0]?.email).toBe("alice@aster.dev");
  });
});

describe("GetAuditLogsUseCase", () => {
  it("passes filters through to the repository (Audit Log 필터)", async () => {
    const repo = new FakeAdminRepository();
    await new GetAuditLogsUseCase(repo).execute({ eventType: "PROJECT_CREATED", limit: 10 });

    expect(repo.lastAuditLogFilter).toEqual({ eventType: "PROJECT_CREATED", limit: 10 });
  });
});

describe("GetProviderHealthUseCase", () => {
  it("reports health for all three providers (Provider 장애 표시)", async () => {
    const useCase = new GetProviderHealthUseCase(
      new MockTextCompletionProvider(),
      new MockImageGenerationProvider(),
      new MockMockupRenderProvider(),
    );

    const health = await useCase.execute();
    expect(health).toHaveLength(3);
    expect(health.every((h) => h.healthy)).toBe(true);
  });

  it("reports unhealthy instead of throwing when a provider's health check rejects", async () => {
    const failingProvider = {
      name: "broken",
      async health() {
        throw new Error("boom");
      },
      async generate() {
        throw new Error("unused");
      },
    };
    const useCase = new GetProviderHealthUseCase(
      new MockTextCompletionProvider(),
      failingProvider as never,
      new MockMockupRenderProvider(),
    );

    const health = await useCase.execute();
    expect(health.find((h) => h.provider === "image_generation")?.healthy).toBe(false);
  });
});

describe("Announcement Use Cases", () => {
  it("creates, lists, and deactivates an announcement", async () => {
    const repo = new FakeAnnouncementRepository();
    const created = await new CreateAnnouncementUseCase(repo).execute({
      adminUserId: "admin-1",
      message: "점검 안내",
    });

    const active = await new ListAnnouncementsUseCase(repo).execute();
    expect(active).toHaveLength(1);

    const deactivated = await new DeactivateAnnouncementUseCase(repo).execute({
      adminUserId: "admin-1",
      announcementId: created.id,
    });
    expect(deactivated.active).toBe(false);

    const activeAfter = await new ListAnnouncementsUseCase(repo).execute();
    expect(activeAfter).toHaveLength(0);
  });

  it("rejects an empty announcement message", async () => {
    const repo = new FakeAnnouncementRepository();
    await expect(
      new CreateAnnouncementUseCase(repo).execute({ adminUserId: "admin-1", message: "   " }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects deactivating an announcement that doesn't exist", async () => {
    const repo = new FakeAnnouncementRepository();
    await expect(
      new DeactivateAnnouncementUseCase(repo).execute({ adminUserId: "admin-1", announcementId: "missing" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

import { describe, expect, it, vi } from "vitest";
import { GetAdminDashboardUseCase } from "@/modules/admin/application/GetAdminDashboardUseCase";
import { GetAdminAnalyticsUseCase } from "@/modules/admin/application/GetAdminAnalyticsUseCase";
import { SearchAdminUsersUseCase } from "@/modules/admin/application/SearchAdminUsersUseCase";
import { GetAuditLogsUseCase } from "@/modules/admin/application/GetAuditLogsUseCase";
import { GetProviderHealthUseCase } from "@/modules/admin/application/GetProviderHealthUseCase";
import { SuspendUserUseCase } from "@/modules/admin/application/SuspendUserUseCase";
import { UnsuspendUserUseCase } from "@/modules/admin/application/UnsuspendUserUseCase";
import { DeleteUserUseCase } from "@/modules/admin/application/DeleteUserUseCase";
import { ChangeUserRoleUseCase } from "@/modules/admin/application/ChangeUserRoleUseCase";
import { GetUserDetailUseCase } from "@/modules/admin/application/GetUserDetailUseCase";
import {
  CreateAnnouncementUseCase,
  DeactivateAnnouncementUseCase,
  ListAnnouncementsUseCase,
} from "@/modules/admin/application/AnnouncementUseCases";
import { FakeAdminRepository, FakeAnnouncementRepository, FakeQueue } from "@/modules/admin/testing/fakes";
import { FakeSubscriptionRepository, FakeUsageRepository } from "@/modules/subscriptions/testing/fakes";
import { GetUsageSummaryUseCase } from "@/modules/subscriptions/application/GetUsageSummaryUseCase";
import { MockTextCompletionProvider } from "@/shared/ai/MockTextCompletionProvider";
import { MockImageGenerationProvider } from "@/shared/ai/MockImageGenerationProvider";
import { MockMockupRenderProvider } from "@/shared/ai/MockMockupRenderProvider";
import { NotFoundError, ValidationError } from "@/shared/errors/AppError";
import type { AdminUserSearchResult } from "@/modules/admin/domain/Admin";

function seedUser(overrides: Partial<AdminUserSearchResult> = {}): AdminUserSearchResult {
  return {
    id: "target-1",
    email: "target@aster.dev",
    name: null,
    role: "designer",
    adminTier: null,
    status: "active",
    planCode: "free",
    projectCount: 0,
    generationCount: 0,
    lastLoginAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

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
    repo.costBreakdown = [
      { source: "generation", totalCost: 3, count: 25 },
      { source: "mockup", totalCost: 1.5, count: 10 },
    ];

    const analytics = await new GetAdminAnalyticsUseCase(repo).execute();

    expect(analytics.usageTrend).toEqual(repo.trend);
    expect(analytics.costTrend).toEqual(repo.costs);
    expect(analytics.totalCostThisMonth).toBe(4.5);
    expect(analytics.costBreakdown).toEqual(repo.costBreakdown);
  });
});

describe("SearchAdminUsersUseCase", () => {
  it("filters users by query (사용자 검색)", async () => {
    const repo = new FakeAdminRepository();
    repo.users = [
      {
        id: "u1",
        email: "alice@aster.dev",
        name: null,
        role: "designer",
        adminTier: null,
        status: "active",
        planCode: "free",
        projectCount: 2,
        generationCount: 0,
        lastLoginAt: null,
        createdAt: new Date(),
      },
      {
        id: "u2",
        email: "bob@aster.dev",
        name: null,
        role: "designer",
        adminTier: null,
        status: "active",
        planCode: "pro",
        projectCount: 1,
        generationCount: 0,
        lastLoginAt: null,
        createdAt: new Date(),
      },
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

describe("SuspendUserUseCase / UnsuspendUserUseCase (회원 정지)", () => {
  it("suspends a user", async () => {
    const repo = new FakeAdminRepository();
    repo.users = [seedUser()];

    await new SuspendUserUseCase(repo).execute({ targetUserId: "target-1", actingUserId: "admin-1" });

    expect(repo.users[0]?.status).toBe("suspended");
  });

  it("unsuspends a user", async () => {
    const repo = new FakeAdminRepository();
    repo.users = [seedUser({ status: "suspended" })];

    await new UnsuspendUserUseCase(repo).execute({ targetUserId: "target-1", actingUserId: "admin-1" });

    expect(repo.users[0]?.status).toBe("active");
  });

  it("rejects suspending yourself (관리자 자기 자신 보호)", async () => {
    const repo = new FakeAdminRepository();
    repo.users = [seedUser({ id: "admin-1" })];

    await expect(
      new SuspendUserUseCase(repo).execute({ targetUserId: "admin-1", actingUserId: "admin-1" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects suspending a user that doesn't exist", async () => {
    const repo = new FakeAdminRepository();
    await expect(
      new SuspendUserUseCase(repo).execute({ targetUserId: "missing", actingUserId: "admin-1" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("DeleteUserUseCase (회원 삭제)", () => {
  it("soft-deletes a user", async () => {
    const repo = new FakeAdminRepository();
    repo.users = [seedUser()];

    await new DeleteUserUseCase(repo).execute({ targetUserId: "target-1", actingUserId: "admin-1" });

    expect(repo.users[0]?.status).toBe("deleted");
  });

  it("rejects deleting yourself (관리자 자기 자신 보호)", async () => {
    const repo = new FakeAdminRepository();
    repo.users = [seedUser({ id: "admin-1" })];

    await expect(
      new DeleteUserUseCase(repo).execute({ targetUserId: "admin-1", actingUserId: "admin-1" }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects deleting a user that doesn't exist", async () => {
    const repo = new FakeAdminRepository();
    await expect(
      new DeleteUserUseCase(repo).execute({ targetUserId: "missing", actingUserId: "admin-1" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("ChangeUserRoleUseCase (권한 변경)", () => {
  it("promotes a designer to admin with a tier", async () => {
    const repo = new FakeAdminRepository();
    repo.users = [seedUser()];

    await new ChangeUserRoleUseCase(repo).execute({
      targetUserId: "target-1",
      actingUserId: "admin-1",
      role: "admin",
      adminTier: "manager",
    });

    expect(repo.users[0]?.role).toBe("admin");
    expect(repo.users[0]?.adminTier).toBe("manager");
  });

  it("demotes an admin back to designer", async () => {
    const repo = new FakeAdminRepository();
    repo.users = [seedUser({ role: "admin", adminTier: "support" })];

    await new ChangeUserRoleUseCase(repo).execute({
      targetUserId: "target-1",
      actingUserId: "admin-1",
      role: "designer",
    });

    expect(repo.users[0]?.role).toBe("designer");
    expect(repo.users[0]?.adminTier).toBeNull();
  });

  it("rejects changing your own role (관리자 자기 자신 보호)", async () => {
    const repo = new FakeAdminRepository();
    repo.users = [seedUser({ id: "admin-1", role: "admin", adminTier: "super_admin" })];

    await expect(
      new ChangeUserRoleUseCase(repo).execute({
        targetUserId: "admin-1",
        actingUserId: "admin-1",
        role: "designer",
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("rejects changing the role of a user that doesn't exist", async () => {
    const repo = new FakeAdminRepository();
    await expect(
      new ChangeUserRoleUseCase(repo).execute({
        targetUserId: "missing",
        actingUserId: "admin-1",
        role: "admin",
        adminTier: "support",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("GetUserDetailUseCase (회원 상세 조회)", () => {
  it("combines profile, recent activity, and usage summary", async () => {
    const adminRepo = new FakeAdminRepository();
    adminRepo.users = [seedUser()];
    adminRepo.auditLogs = [
      { id: "log-1", userId: "target-1", projectId: null, eventType: "USER_LOGGED_IN", payload: {}, createdAt: new Date() },
    ];
    const subscriptionRepo = new FakeSubscriptionRepository();
    const usageRepo = new FakeUsageRepository();
    const getAuditLogsUseCase = new GetAuditLogsUseCase(adminRepo);
    const getUsageSummaryUseCase = new GetUsageSummaryUseCase(subscriptionRepo, usageRepo);

    const detail = await new GetUserDetailUseCase(adminRepo, getAuditLogsUseCase, getUsageSummaryUseCase).execute({
      targetUserId: "target-1",
      actingUserId: "admin-1",
    });

    expect(detail.profile.id).toBe("target-1");
    expect(detail.recentActivity).toHaveLength(1);
    expect(detail.usage.planCode).toBe("free");
    expect(adminRepo.lastAuditLogFilter).toEqual({ userId: "target-1", limit: 50 });
  });

  it("rejects when the target user doesn't exist", async () => {
    const adminRepo = new FakeAdminRepository();
    const subscriptionRepo = new FakeSubscriptionRepository();
    const usageRepo = new FakeUsageRepository();

    await expect(
      new GetUserDetailUseCase(
        adminRepo,
        new GetAuditLogsUseCase(adminRepo),
        new GetUsageSummaryUseCase(subscriptionRepo, usageRepo),
      ).execute({ targetUserId: "missing", actingUserId: "admin-1" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
